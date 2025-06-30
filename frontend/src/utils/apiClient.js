import axios from 'axios';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL + '/api',
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('uspf_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retries
apiClient.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`API Request to ${response.config.url} took ${duration}ms`);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      duration: new Date() - error.config?.metadata?.startTime
    });
    
    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('uspf_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, expires_in } = response.data;
          const newExpiry = Math.floor(Date.now() / 1000) + expires_in;
          
          localStorage.setItem('uspf_access_token', access_token);
          localStorage.setItem('uspf_token_expiry', newExpiry.toString());
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem('uspf_access_token');
        localStorage.removeItem('uspf_refresh_token');
        localStorage.removeItem('uspf_token_expiry');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Retry logic for network errors
    if (
      !originalRequest._retry && 
      (error.code === 'NETWORK_ERROR' || 
       error.code === 'ECONNABORTED' ||
       error.response?.status >= 500)
    ) {
      originalRequest._retry = true;
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, originalRequest.retryCount || 0), 5000);
      originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;
      
      if (originalRequest.retryCount <= 3) {
        console.log(`Retrying request to ${originalRequest.url} in ${delay}ms (attempt ${originalRequest.retryCount})`);
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(apiClient(originalRequest));
          }, delay);
        });
      }
    }
    
    // Enhanced error message for user-friendly feedback
    let userMessage = 'An error occurred. Please try again.';
    
    if (error.response?.status === 401) {
      userMessage = 'Authentication failed. Please log in again.';
    } else if (error.response?.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.response?.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.response?.data?.detail) {
      userMessage = error.response.data.detail;
    }
    
    error.userMessage = userMessage;
    return Promise.reject(error);
  }
);

// Helper function for making API calls with better error handling
export const makeApiCall = async (requestConfig) => {
  try {
    const response = await apiClient(requestConfig);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error.userMessage || error.message,
      status: error.response?.status,
      details: error.response?.data
    };
  }
};

// Specific API functions
export const api = {
  // Authentication
  login: (credentials) => makeApiCall({
    method: 'POST',
    url: '/auth/login',
    data: credentials
  }),
  
  refreshToken: (refreshToken) => makeApiCall({
    method: 'POST',
    url: '/auth/refresh',
    data: { refresh_token: refreshToken }
  }),
  
  getCurrentUser: () => makeApiCall({
    method: 'GET',
    url: '/auth/me'
  }),
  
  // Inventory
  getInventory: () => makeApiCall({
    method: 'GET',
    url: '/inventory'
  }),
  
  createInventoryItem: (item) => makeApiCall({
    method: 'POST',
    url: '/inventory',
    data: item
  }),
  
  updateInventoryItem: (id, updates) => makeApiCall({
    method: 'PUT',
    url: `/inventory/${id}`,
    data: updates
  }),
  
  getBinCardHistory: (itemId) => makeApiCall({
    method: 'GET',
    url: `/inventory/${itemId}/bin-card`
  }),
  
  // Dashboard
  getDashboardStats: () => makeApiCall({
    method: 'GET',
    url: '/dashboard/stats'
  }),
  
  // Requisitions
  getRequisitions: () => makeApiCall({
    method: 'GET',
    url: '/requisitions'
  }),
  
  createRequisition: (requisition) => makeApiCall({
    method: 'POST',
    url: '/requisitions',
    data: requisition
  }),
  
  updateRequisition: (id, updates) => makeApiCall({
    method: 'PUT',
    url: `/requisitions/${id}`,
    data: updates
  }),
  
  // Reports
  getLowStockItems: () => makeApiCall({
    method: 'GET',
    url: '/reports/low-stock'
  })
};

export default apiClient;