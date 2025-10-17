// Django Backend Authentication Handlers

// Prevent multiple simultaneous requests
let isLoggingIn = false;
let isRegistering = false;

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm')?.value || password;

    if (password !== passwordConfirm) {
        app.utils.showAlert('Passwords do not match', 'danger');
        return;
    }

    try {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        const userData = {
            username: email,
            email: email,
            first_name: firstName,
            last_name: lastName,
            password: password,
            password_confirm: passwordConfirm
        };

        console.log('Attempting registration with data:', userData);
        const user = await window.djangoAuth.register(userData);
        console.log('Registration successful:', user);
        window.djangoAuth.setCurrentUser(user);
        
        app.utils.showAlert('Registration successful! You are now logged in.', 'success');
        
        // Trigger auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        // Switch to login tab
        document.querySelector('[data-bs-target="#loginTab"]').click();
    } catch (error) {
        console.error('Registration error:', error);
        app.utils.showAlert(`Registration failed: ${error.message}`, 'danger');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    // Prevent multiple simultaneous login attempts
    if (isLoggingIn) {
        console.log('Login already in progress, ignoring...');
        return;
    }
    
    isLoggingIn = true;
    
    // Prevent multiple submissions
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) {
        isLoggingIn = false;
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            app.utils.showAlert('Please enter both email and password', 'warning');
            return;
        }

        console.log('Attempting login with:', { email, password: '***' });
        
        const credentials = {
            username: email,
            password: password
        };

        const user = await window.djangoAuth.login(credentials);
        window.djangoAuth.setCurrentUser(user);
        
        console.log('Login successful:', user);
        app.utils.showAlert('Successfully logged in!', 'success');
        
        // Trigger auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    } catch (error) {
        console.error('Login error:', error);
        app.utils.showAlert(`Login failed: ${error.message}`, 'danger');
    } finally {
        // Re-enable button and reset flag
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
        isLoggingIn = false;
    }
}

// Handle logout
async function handleLogout() {
    try {
        await window.djangoAuth.logout();
        app.utils.showAlert('Successfully logged out!', 'success');
        
        // Trigger auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    } catch (error) {
        console.error('Logout error:', error);
        app.utils.showAlert(error.message, 'danger');
    }
}

// Initialize auth listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});
