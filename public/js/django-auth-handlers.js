// Django Backend Authentication Handlers

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

        const user = await window.djangoAuth.register(userData);
        window.djangoAuth.setCurrentUser(user);
        
        app.utils.showAlert('Registration successful! You are now logged in.', 'success');
        
        // Trigger auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        
        // Switch to login tab
        document.querySelector('[data-bs-target="#loginTab"]').click();
    } catch (error) {
        console.error('Registration error:', error);
        app.utils.showAlert(error.message, 'danger');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            app.utils.showAlert('Please enter both email and password', 'warning');
            return;
        }

        const credentials = {
            username: email,
            password: password
        };

        const user = await window.djangoAuth.login(credentials);
        window.djangoAuth.setCurrentUser(user);
        
        app.utils.showAlert('Successfully logged in!', 'success');
        
        // Trigger auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));
    } catch (error) {
        console.error('Login error:', error);
        app.utils.showAlert(error.message, 'danger');
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
