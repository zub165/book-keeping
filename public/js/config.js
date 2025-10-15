// Production Configuration
const CONFIG = {
    // API Configuration
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3017/api'  // Local development
        : 'http://208.109.215.53:3017/api',  // Production - your GoDaddy server (Family Bookkeeping)
    
    // App Configuration
    APP_NAME: 'Family Bookkeeping',
    VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        REGISTRATION: true,
        STATISTICS: true,
        EXPORT: false
    }
};

// Make config available globally
window.APP_CONFIG = CONFIG;
