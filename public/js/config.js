// Production Configuration
const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3017/api'  // Local development
        : 'https://api.mywaitime.com/family-api',  // Production - Family Bookkeeping via Nginx HTTPS routing
    
    // App Configuration
    APP_NAME: 'Family Bookkeeping',
    VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        REGISTRATION: true,
        STATISTICS: true,
        EXPORT: true
    }
};

// Make config available globally
window.APP_CONFIG = CONFIG;
