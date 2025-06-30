import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('uspf_access_token'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('uspf_refresh_token'));
    const [tokenExpiry, setTokenExpiry] = useState(localStorage.getItem('uspf_token_expiry'));

    // Use environment variable for API base URL
    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    // Axios interceptor for automatic token refresh
    const setupAxiosInterceptors = useCallback(() => {
        const requestInterceptor = axios.interceptors.request.use((config) => {
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && refreshToken) {
                    try {
                        await refreshAccessToken();
                        // Retry the original request
                        const originalRequest = error.config;
                        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('uspf_access_token')}`;
                        return axios.request(originalRequest);
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        logout();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [accessToken, refreshToken]);

    useEffect(() => {
        const cleanup = setupAxiosInterceptors();
        return cleanup;
    }, [setupAxiosInterceptors]);

    // Auto-refresh token before expiry
    useEffect(() => {
        if (accessToken && tokenExpiry && refreshToken) {
            const expiryTime = parseInt(tokenExpiry);
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = expiryTime - currentTime;
            
            // Refresh 5 minutes before expiry
            const refreshTime = Math.max(timeUntilExpiry - 300, 60) * 1000;
            
            if (refreshTime > 0) {
                const refreshTimeout = setTimeout(() => {
                    refreshAccessToken();
                }, refreshTime);
                
                return () => clearTimeout(refreshTimeout);
            }
        }
    }, [accessToken, tokenExpiry, refreshToken]);

    useEffect(() => {
        if (accessToken) {
            validateToken();
        } else {
            setIsLoading(false);
        }
    }, [accessToken]);

    const validateToken = async () => {
        try {
            const response = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Token validation failed:', error);
            if (refreshToken) {
                try {
                    await refreshAccessToken();
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    clearTokens();
                }
            } else {
                clearTokens();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const refreshAccessToken = async () => {
        try {
            const response = await axios.post(`${API_BASE}/auth/refresh`, {
                refresh_token: refreshToken
            });

            const { access_token, expires_in } = response.data;
            const newExpiry = Math.floor(Date.now() / 1000) + expires_in;

            setAccessToken(access_token);
            setTokenExpiry(newExpiry.toString());
            
            localStorage.setItem('uspf_access_token', access_token);
            localStorage.setItem('uspf_token_expiry', newExpiry.toString());
            
            console.log('Token refreshed successfully');
            return access_token;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            clearTokens();
            throw error;
        }
    };

    const clearTokens = () => {
        setAccessToken(null);
        setRefreshToken(null);
        setTokenExpiry(null);
        setUser(null);
        localStorage.removeItem('uspf_access_token');
        localStorage.removeItem('uspf_refresh_token');
        localStorage.removeItem('uspf_token_expiry');
    };

    const login = async (username, password) => {
        try {
            setIsLoading(true);
            
            // Retry mechanism for login
            let loginAttempts = 0;
            const maxAttempts = 3;
            
            while (loginAttempts < maxAttempts) {
                try {
                    const response = await axios.post(`${API_BASE}/auth/login`, {
                        username,
                        password
                    }, {
                        timeout: 10000 // 10 second timeout
                    });

                    if (response.data.success) {
                        const { 
                            access_token, 
                            refresh_token, 
                            expires_in, 
                            user: userData 
                        } = response.data;
                        
                        const expiry = Math.floor(Date.now() / 1000) + expires_in;
                        
                        setAccessToken(access_token);
                        setRefreshToken(refresh_token);
                        setTokenExpiry(expiry.toString());
                        setUser(userData);
                        
                        localStorage.setItem('uspf_access_token', access_token);
                        localStorage.setItem('uspf_refresh_token', refresh_token);
                        localStorage.setItem('uspf_token_expiry', expiry.toString());
                        
                        toast.success('Login successful!');
                        return { success: true };
                    } else {
                        toast.error('Login failed');
                        return { success: false, error: 'Login failed' };
                    }
                } catch (error) {
                    loginAttempts++;
                    console.error(`Login attempt ${loginAttempts} failed:`, error);
                    
                    if (loginAttempts >= maxAttempts) {
                        throw error;
                    }
                    
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * loginAttempts));
                }
            }
            
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.detail || 'Login failed. Please try again.';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearTokens();
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        refreshAccessToken,
        isAuthenticated: !!user && !!accessToken,
        accessToken,
        refreshToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};