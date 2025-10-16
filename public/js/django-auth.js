// Django Backend Authentication
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3017/api';

// API utility functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        let token = localStorage.getItem('access_token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            // Check if token is expired (401 Unauthorized)
            if (response.status === 401) {
                console.log('Token expired, attempting refresh...');
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry the original request with new token
                    const newToken = localStorage.getItem('access_token');
                    config.headers['Authorization'] = `Bearer ${newToken}`;
                    const retryResponse = await fetch(url, config);
                    const retryData = await retryResponse.json();
                    
                    if (!retryResponse.ok) {
                        throw new Error(retryData.error || retryData.detail || 'Request failed after token refresh');
                    }
                    return retryData;
                } else {
                    // Refresh failed, redirect to login
                    this.handleTokenExpired();
                    throw new Error('Session expired. Please login again.');
                }
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.detail || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                console.log('No refresh token available');
                return false;
            }
            
            const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access_token', data.access);
                console.log('Token refreshed successfully');
                return true;
            } else {
                console.log('Token refresh failed - endpoint not available yet');
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    },
    
    handleTokenExpired() {
        console.log('Handling token expiration...');
        // Clear all auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Show alert to user
        if (window.app && window.app.utils) {
            window.app.utils.showAlert('Your session has expired. Please login again.', 'warning');
        }
        
        // Trigger auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        // Optionally redirect to login tab
        const loginTab = document.querySelector('[data-bs-target="#loginTab"]');
        if (loginTab) {
            loginTab.click();
        }
    },
    
    async get(endpoint) {
        return this.request(endpoint);
    },
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// Authentication functions
const auth = {
    async register(userData) {
        try {
            const response = await api.post('/auth/register/', userData);
            this.setTokens(response.tokens);
            return response.user;
        } catch (error) {
            throw error;
        }
    },
    
    async login(credentials) {
        try {
            const response = await api.post('/auth/login/', credentials);
            this.setTokens(response.tokens);
            return response.user;
        } catch (error) {
            throw error;
        }
    },
    
    async logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },
    
    setTokens(tokens) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
    },
    
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    setCurrentUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },
    
    isAuthenticated() {
        const token = localStorage.getItem('access_token');
        if (!token) return false;
        
        // Check if token is expired (basic JWT decode)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                console.log('Token is expired, clearing auth data');
                this.logout();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking token:', error);
            return false;
        }
    },
    
    // Proactive token check before making requests
    async checkTokenAndRefresh() {
        if (!this.isAuthenticated()) {
            return false;
        }
        
        const token = localStorage.getItem('access_token');
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = payload.exp - currentTime;
            
            // If token expires in less than 5 minutes, try to refresh
            if (timeUntilExpiry < 300) {
                console.log('Token expires soon, attempting refresh...');
                const refreshed = await window.djangoAPI.refreshToken();
                if (!refreshed) {
                    console.log('Token refresh failed, user will need to login again');
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error checking token expiry:', error);
            return false;
        }
    }
};

// Data management functions
const dataManager = {
    async getFamilyMembers() {
        // Check token before making request
        const tokenValid = await auth.checkTokenAndRefresh();
        if (!tokenValid) {
            throw new Error('Session expired. Please login again.');
        }
        return api.get('/family-members/');
    },
    
    async createFamilyMember(memberData) {
        // Check token before making request
        const tokenValid = await auth.checkTokenAndRefresh();
        if (!tokenValid) {
            throw new Error('Session expired. Please login again.');
        }
        return api.post('/family-members/', memberData);
    },
    
    async getExpenses(familyMemberId) {
        return api.get(`/expenses/?family_member_id=${familyMemberId}`);
    },
    
    async createExpense(expenseData) {
        return api.post('/expenses/', expenseData);
    },
    
    async getMiles(familyMemberId) {
        return api.get(`/miles/?family_member_id=${familyMemberId}`);
    },
    
    async createMile(mileData) {
        return api.post('/miles/', mileData);
    },
    
    async getHours(familyMemberId) {
        return api.get(`/hours/?family_member_id=${familyMemberId}`);
    },
    
    async createHour(hourData) {
        return api.post('/hours/', hourData);
    },
    
    async getStatistics(familyMemberId) {
        return api.get(`/statistics/?family_member_id=${familyMemberId}`);
    }
};

// Make functions available globally
window.djangoAuth = auth;
window.djangoAPI = api;
window.djangoData = dataManager;
