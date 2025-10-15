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
            const response = await fetch(url, config);
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
        return !!localStorage.getItem('access_token');
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
