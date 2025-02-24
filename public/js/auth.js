// Use the global app instance
const app = window.app;

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const fullName = document.getElementById('registerName').value;

    try {
        // 1. Sign up the user
        const { data: authData, error: authError } = await app.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    full_name: fullName,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
                }
            }
        });

        if (authError) throw authError;

        // 2. Create their first family member record (themselves)
        const { data: familyMemberData, error: familyError } = await app.supabase
            .from('family_members')
            .insert([
                { 
                    user_id: authData.user.id,
                    name: fullName,
                    relation: 'Self',
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (familyError) throw familyError;

        app.utils.showAlert('Registration successful! Please check your email for verification.', 'success');
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

        const { data, error } = await app.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        if (data.user) {
            app.state.currentUser = data.user;
            app.utils.showAlert('Successfully logged in!', 'success');
        }
    } catch (error) {
        console.error('Login error:', error);
        app.utils.showAlert(error.message, 'danger');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await app.supabase.auth.signOut();
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