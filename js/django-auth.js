// Django Backend Authentication
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3017/api';

// API utility functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('access_token');
        
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
            console.log('API Request:', { url, config, body: config.body });
            const response = await fetch(url, config);
            console.log('API Response:', { status: response.status, statusText: response.statusText, url: response.url });
            
            // Check if response is ok
            if (!response.ok) {
                // Handle 401 Unauthorized - try to refresh token (only for authenticated endpoints)
                if (response.status === 401 && config.headers['Authorization']) {
                    console.log('401 Unauthorized, attempting token refresh...');
                    const refreshed = await window.djangoAuth.refreshToken();
                    if (refreshed) {
                        // Retry the request with new token
                        const newToken = localStorage.getItem('access_token');
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        const retryResponse = await fetch(url, config);
                        if (retryResponse.ok) {
                            const contentType = retryResponse.headers.get('content-type') || '';
                            if (!contentType.includes('application/json')) {
                                const text = await retryResponse.text();
                                throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
                            }
                            return await retryResponse.json();
                        }
                    }
                }
                
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    // Handle specific error messages
                    if (data.error === 'Invalid credentials') {
                        throw new Error('Invalid credentials');
                    }
                    throw new Error(data.error || data.detail || `HTTP ${response.status}: Request failed`);
                } else {
                    const text = await response.text();
                    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
                }
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    async get(endpoint) {
        return this.request(endpoint);
    },
    
    async post(endpoint, data) {
        console.log('API POST:', { endpoint, data });
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
        
        // Check if token is expired
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                console.log('Token expired, attempting refresh...');
                this.refreshToken();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Invalid token:', error);
            return false;
        }
    },
    
    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            this.logout();
            return false;
        }
        
        try {
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
                localStorage.setItem('refresh_token', data.refresh);
                console.log('Token refreshed successfully');
                return true;
            } else {
                console.error('Token refresh failed');
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }
};

// Data management functions
const dataManager = {
    async getFamilyMembers() {
        return api.get('/family-members/');
    },
    
    async createFamilyMember(memberData) {
        return api.post('/family-members/', memberData);
    },
    
    async getExpenses(familyMemberId) {
        return api.get(`/expenses/?family_member_id=${familyMemberId}`);
    },
    
    async createExpense(expenseData) {
        return api.post('/expenses/', expenseData);
    },
    
    async updateExpense(expenseId, expenseData) {
        return api.put(`/expenses/${expenseId}/`, expenseData);
    },
    
    async deleteExpense(expenseId) {
        return api.delete(`/expenses/${expenseId}/`);
    },
    
    async getMiles(familyMemberId) {
        return api.get(`/miles/?family_member_id=${familyMemberId}`);
    },
    
    async createMile(mileData) {
        return api.post('/miles/', mileData);
    },
    
    async updateMile(mileId, mileData) {
        return api.put(`/miles/${mileId}/`, mileData);
    },
    
    async deleteMile(mileId) {
        return api.delete(`/miles/${mileId}/`);
    },
    
    async getHours(familyMemberId) {
        return api.get(`/hours/?family_member_id=${familyMemberId}`);
    },
    
    async createHour(hourData) {
        return api.post('/hours/', hourData);
    },
    
    async updateHour(hourId, hourData) {
        return api.put(`/hours/${hourId}/`, hourData);
    },
    
    async deleteHour(hourId) {
        return api.delete(`/hours/${hourId}/`);
    },
    
    async getStatistics(familyMemberId) {
        return api.get(`/statistics/?family_member_id=${familyMemberId}`);
    },
    
    // Family Member Management
    async createFamilyMember(memberData) {
        return api.post('/family-members/', memberData);
    },
    
    async updateFamilyMember(memberId, memberData) {
        return api.put(`/family-members/${memberId}/`, memberData);
    },
    
    async deleteFamilyMember(memberId) {
        return api.delete(`/family-members/${memberId}/`);
    },
    
    // Email Functions
    async sendFamilyReport(recipientEmail, recipientName, familyMemberId, reportType) {
        return api.post('/email/send-report/', {
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            family_member_id: familyMemberId,
            report_type: reportType
        });
    },
    
    async sendWelcomeEmail(recipientEmail, recipientName) {
        return api.post('/email/welcome/', {
            recipient_email: recipientEmail,
            recipient_name: recipientName
        });
    },
    
    async sendMonthlySummary(familyMemberId) {
        return api.post('/email/monthly-summary/', {
            family_member_id: familyMemberId
        });
    },
    
    async testEmail(testEmail) {
        return api.post('/email/test/', {
            test_email: testEmail
        });
    },
    
    // Multi-user family system API calls
    async getUserFamilyMember() {
        return api.get('/user/family-member/');
    },
    
    async getAllFamilyData() {
        return api.get('/family/all-data/');
    },
    
    async getFamilyMemberData(memberId) {
        return api.get(`/family/member/${memberId}/`);
    }
};

// Make functions available globally
window.djangoAuth = auth;
window.djangoAPI = api;
window.djangoData = dataManager;
