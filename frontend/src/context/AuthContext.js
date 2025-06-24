import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const [token, setToken] = useState(localStorage.getItem('uspf_token'));

    const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const validateToken = async () => {
        try {
            const response = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
        } catch (error) {
            localStorage.removeItem('uspf_token');
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setIsLoading(true);
            const response = await axios.post(`${API_BASE}/auth/login`, {
                username,
                password
            });

            if (response.data.success) {
                const { token: newToken, user: userData } = response.data;
                setToken(newToken);
                setUser(userData);
                localStorage.setItem('uspf_token', newToken);
                toast.success('Login successful!');
                return { success: true };
            } else {
                toast.error('Login failed');
                return { success: false, error: 'Login failed' };
            }
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('uspf_token');
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};