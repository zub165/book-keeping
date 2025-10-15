// Simple alert function
function showAlert(message, type = 'success') {
    const container = document.querySelector('.container');
    if (!container) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 3000);
}

// Simple utility functions
function handleError(error, context = 'Operation') {
    console.error(`${context} error:`, error);
    const message = error.message || `${context} failed. Please try again.`;
    window.app.utils.showAlert(message, 'danger');
}

// Only define the global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', { msg, url, lineNo, columnNo, error });
    if (window.app && window.app.utils) {
        window.app.utils.showAlert('An unexpected error occurred. Please try again.', 'danger');
    }
    return false;
};

// Attach utilities to global namespace
window.app.utils.showAlert = function(message, type = 'success') {
    const container = document.querySelector('.container');
    if (!container) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const navTabs = container.querySelector('.nav-tabs');
    if (navTabs) {
        container.insertBefore(alertDiv, navTabs);
        setTimeout(() => alertDiv.remove(), 3000);
    }
};

window.app.utils.handleError = function(error, context = 'Operation') {
    console.error(`${context} error:`, error);
    const message = error.message || `${context} failed. Please try again.`;
    window.app.utils.showAlert(message, 'danger');
}; 