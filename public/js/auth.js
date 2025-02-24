// Use the global app instance
const app = window.app;

// Add session management
let currentSession = null;

async function checkSession() {
    try {
        const { data: { session }, error } = await app.supabase.auth.getSession();
        if (error) throw error;
        
        currentSession = session;
        return session;
    } catch (error) {
        console.error('Session check error:', error);
        return null;
    }
}

// Update auth state change handler
app.supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event, session);
    currentSession = session;
    
    if (event === 'SIGNED_IN') {
        await initializeApp(session);
    } else if (event === 'SIGNED_OUT') {
        resetAppState();
    }
});

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
                data: { full_name: fullName }
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

        app.utils.showAlert('Registration successful! Please check your email.', 'success');
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
            app.utils.showAlert('Successfully logged in!', 'success');
            window.location.reload();
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
        window.location.reload();
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

    // Check for existing session
    app.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            document.getElementById('authContainer').classList.add('d-none');
            document.getElementById('appContainer').classList.remove('d-none');
        }
    });
}); 