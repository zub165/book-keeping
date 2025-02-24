// Use the existing global app instance without redeclaring
const { supabase, state, utils } = window.app;

// Global state (local to this module)
let currentUser = null;
let currentFamilyMember = null;
let isLoading = false;

// Add loading indicator function
function setLoading(loading) {
    isLoading = loading;
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
        button.disabled = loading;
        if (loading) {
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    });
}

// Add state management
const appState = {
    currentUser: null,
    currentFamilyMember: null,
    familyMembers: [],
    expenses: [],
    miles: [],
    hours: [],
    
    reset() {
        this.currentUser = null;
        this.currentFamilyMember = null;
        this.familyMembers = [];
        this.expenses = [];
        this.miles = [];
        this.hours = [];
        this.updateUI();
    },
    
    updateUI() {
        // Update all UI elements based on state
        updateStatistics();
        updateLists();
        updateFamilyMemberSelect();
    }
};

// Initialize the app
function initializeApp(session) {
    return new Promise(async (resolve, reject) => {
        try {
            if (session) {
                currentUser = session.user;
                state.currentUser = session.user;
                await updateUserProfile(session.user);
                await loadFamilyMembers();
                await updateStatistics();
            }
            resolve();
        } catch (error) {
            console.error('Error initializing app:', error);
            utils.showAlert('Error initializing application', 'danger');
            reject(error);
        }
    });
}

// Reset app state
function resetAppState() {
    currentUser = null;
    currentFamilyMember = null;
    state.currentUser = null;
    state.currentFamilyMember = null;
    
    // Reset UI elements
    const forms = ['expenseForm', 'milesForm', 'hoursForm'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.reset();
    });
    
    // Clear lists
    ['expenseList', 'milesList', 'hoursList'].forEach(listId => {
        const list = document.getElementById(listId);
        if (list) list.innerHTML = '';
    });
    
    // Reset statistics
    document.getElementById('totalExpenses').textContent = '$0.00';
    document.getElementById('totalMiles').textContent = '0 miles';
    document.getElementById('totalHours').textContent = '0 hours';
    
    // Reset family member select
    const select = document.getElementById('familyMemberSelect');
    if (select) select.innerHTML = '<option value="">Select Family Member</option>';
}

// Make functions available globally
window.appFunctions = {
    initialize: initializeApp,
    reset: resetAppState,
    addFamilyMember: addFamilyMember,
    handleAddFamilyMember: handleAddFamilyMember
};

document.addEventListener('DOMContentLoaded', () => {
    // Set up form submissions
    const expenseForm = document.getElementById('expenseForm');
    const milesForm = document.getElementById('milesForm');
    const hoursForm = document.getElementById('hoursForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (expenseForm) expenseForm.addEventListener('submit', handleExpenseSubmit);
    if (milesForm) milesForm.addEventListener('submit', handleMilesSubmit);
    if (hoursForm) hoursForm.addEventListener('submit', handleHoursSubmit);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            initializeApp(session);
        }
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            initializeApp(session);
        } else if (event === 'SIGNED_OUT') {
            // Clear state
            state.currentUser = null;
            currentFamilyMember = null;
            
            // Reset UI
            document.getElementById('authContainer').classList.remove('d-none');
            document.getElementById('appContainer').classList.add('d-none');
            
            // Clear forms
            document.getElementById('expenseForm')?.reset();
            document.getElementById('milesForm')?.reset();
            document.getElementById('hoursForm')?.reset();
            
            // Clear lists
            document.getElementById('expenseList').innerHTML = '';
            document.getElementById('milesList').innerHTML = '';
            document.getElementById('hoursList').innerHTML = '';
            
            // Reset statistics
            document.getElementById('totalExpenses').textContent = '$0.00';
            document.getElementById('totalMiles').textContent = '0 miles';
            document.getElementById('totalHours').textContent = '0 hours';
        }
    });
});

// Expense functions
async function loadExpenses() {
    if (!currentFamilyMember) return;

    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('family_member_id', currentFamilyMember.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const expenseList = document.getElementById('expenseList');
        if (expenseList) {
            if (Array.isArray(data) && data.length > 0) {
                expenseList.innerHTML = data.map(expense => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${expense.description}</h6>
                            <small class="date-badge">
                                <i class="far fa-calendar-alt me-1"></i>
                                ${new Date(expense.created_at).toLocaleDateString()}
                            </small>
                        </div>
                        <span class="amount-badge bg-primary text-white">
                            $${parseFloat(expense.amount).toFixed(2)}
                        </span>
                    </li>
                `).join('');
            } else {
                expenseList.innerHTML = `
                    <li class="list-group-item text-center text-muted">
                        <i class="fas fa-info-circle me-2"></i>
                        No expenses found
                    </li>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
        utils.showAlert('Error loading expenses', 'danger');
    }
}

// Add this function to get the current session
async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

// Add validation functions
function validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000000;
}

function validateDescription(description) {
    return description && description.trim().length >= 3 && description.trim().length <= 200;
}

// Update form handlers with validation
async function handleExpenseSubmit(event) {
    event.preventDefault();
    if (isLoading) return;
    
    if (!currentFamilyMember) {
        utils.showAlert('Please select a family member first', 'warning');
        return;
    }

    const form = event.target;
    const description = form.querySelector('#expenseDesc').value.trim();
    const amount = parseFloat(form.querySelector('#expenseAmount').value);

    if (!validateDescription(description)) {
        utils.showAlert('Description must be between 3 and 200 characters', 'warning');
        return;
    }

    if (!validateAmount(amount)) {
        utils.showAlert('Amount must be between 0 and 1,000,000', 'warning');
        return;
    }

    try {
        setLoading(true);
        console.log('Submitting expense for family member:', currentFamilyMember);

        const { data, error } = await supabase
            .from('expenses')
            .insert([{ 
                description, 
                amount,
                family_member_id: currentFamilyMember.id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Expense added:', data);
        utils.showAlert('Expense added successfully!', 'success');
        form.reset();
        
        await Promise.all([
            loadExpenses(),
            updateStatistics()
        ]);
    } catch (error) {
        console.error('Error adding expense:', error);
        utils.showAlert(`Error: ${error.message}`, 'danger');
    } finally {
        setLoading(false);
    }
}

// Miles functions
async function loadMiles() {
    if (!currentFamilyMember) return;

    try {
        const { data, error } = await supabase
            .from('miles')
            .select('*')
            .eq('family_member_id', currentFamilyMember.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const milesList = document.getElementById('milesList');
        if (milesList) {
            if (Array.isArray(data) && data.length > 0) {
                milesList.innerHTML = data.map(mile => `
                    <li class="list-group-item">
                        ${mile.description}: ${parseFloat(mile.miles).toFixed(1)} miles
                        <small class="text-muted">${new Date(mile.created_at).toLocaleDateString()}</small>
                    </li>
                `).join('');
            } else {
                milesList.innerHTML = '<li class="list-group-item">No miles recorded</li>';
            }
        }
    } catch (error) {
        console.error('Error loading miles:', error);
        utils.showAlert(error.message, 'danger');
    }
}

async function handleMilesSubmit(event) {
    event.preventDefault();
    
    if (!currentFamilyMember) {
        utils.showAlert('Please select a family member first', 'warning');
        return;
    }

    const form = event.target;
    const description = form.querySelector('#milesDesc').value;
    const miles = parseFloat(form.querySelector('#milesAmount').value);

    if (!description || isNaN(miles)) {
        utils.showAlert('Please enter valid description and miles', 'danger');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('miles')
            .insert([{ 
                description, 
                miles,
                family_member_id: currentFamilyMember.id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        utils.showAlert('Miles added successfully!', 'success');
        form.reset();
        
        // Reload data and update statistics
        await Promise.all([
            loadMiles(),
            updateStatistics()
        ]);
    } catch (error) {
        console.error('Error adding miles:', error);
        utils.showAlert(error.message, 'danger');
        // Don't reset the form on error
    }
}

// Hours functions
async function loadHours() {
    if (!currentFamilyMember) return;

    try {
        const { data, error } = await supabase
            .from('hours')
            .select('*')
            .eq('family_member_id', currentFamilyMember.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const hoursList = document.getElementById('hoursList');
        if (hoursList) {
            if (Array.isArray(data) && data.length > 0) {
                hoursList.innerHTML = data.map(hour => `
                    <li class="list-group-item">
                        ${hour.description}: ${parseFloat(hour.hours).toFixed(1)} hours
                        <small class="text-muted">${new Date(hour.created_at).toLocaleDateString()}</small>
                    </li>
                `).join('');
            } else {
                hoursList.innerHTML = '<li class="list-group-item">No hours recorded</li>';
            }
        }
    } catch (error) {
        console.error('Error loading hours:', error);
        utils.showAlert(error.message, 'danger');
    }
}

async function handleHoursSubmit(event) {
    event.preventDefault();
    
    if (!currentFamilyMember) {
        utils.showAlert('Please select a family member first', 'warning');
        return;
    }

    const form = event.target;
    const description = form.querySelector('#hoursDesc').value;
    const hours = parseFloat(form.querySelector('#hoursAmount').value);

    if (!description || isNaN(hours)) {
        utils.showAlert('Please enter valid description and hours', 'danger');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('hours')
            .insert([{ 
                description, 
                hours,
                family_member_id: currentFamilyMember.id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        utils.showAlert('Hours added successfully!', 'success');
        form.reset();
        
        // Reload data and update statistics
        await Promise.all([
            loadHours(),
            updateStatistics()
        ]);
    } catch (error) {
        console.error('Error adding hours:', error);
        utils.showAlert(error.message, 'danger');
        // Don't reset the form on error
    }
}

// Family member functions
async function loadFamilyMembers() {
    try {
        const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', state.currentUser.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('familyMemberSelect');
        if (select && Array.isArray(data)) {
            select.innerHTML = '<option value="">Select Family Member</option>' +
                data.map(member => `
                    <option value="${member.id}">${member.name} (${member.relation})</option>
                `).join('');

            // Set the first family member as default if available
            if (data.length > 0) {
                currentFamilyMember = data[0];
                select.value = currentFamilyMember.id;
                await Promise.all([
                    loadExpenses(),
                    loadMiles(),
                    loadHours(),
                    updateStatistics()
                ]);
            }

            select.addEventListener('change', (e) => {
                handleFamilyMemberChange(e.target.value, data);
            });
        }
    } catch (error) {
        console.error('Error loading family members:', error);
        utils.showAlert('Failed to load family members', 'danger');
    }
}

// Update the statistics function
async function updateStatistics() {
    if (!currentFamilyMember) {
        // Reset statistics if no family member selected
        document.getElementById('totalExpenses').textContent = '$0.00';
        document.getElementById('totalMiles').textContent = '0 miles';
        document.getElementById('totalHours').textContent = '0 hours';
        return;
    }

    try {
        // Get all data in parallel
        const [expenseResult, milesResult, hoursResult] = await Promise.all([
            supabase
                .from('expenses')
                .select('amount')
                .eq('family_member_id', currentFamilyMember.id),
            supabase
                .from('miles')
                .select('miles')
                .eq('family_member_id', currentFamilyMember.id),
            supabase
                .from('hours')
                .select('hours')
                .eq('family_member_id', currentFamilyMember.id)
        ]);

        // Check for errors
        if (expenseResult.error) throw expenseResult.error;
        if (milesResult.error) throw milesResult.error;
        if (hoursResult.error) throw hoursResult.error;

        // Calculate totals with null checks
        const totalExpenses = (expenseResult.data || []).reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
        const totalMiles = (milesResult.data || []).reduce((sum, mile) => sum + (parseFloat(mile.miles) || 0), 0);
        const totalHours = (hoursResult.data || []).reduce((sum, hour) => sum + (parseFloat(hour.hours) || 0), 0);

        // Update UI
        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('totalMiles').textContent = `${totalMiles.toFixed(1)} miles`;
        document.getElementById('totalHours').textContent = `${totalHours.toFixed(1)} hours`;
    } catch (error) {
        console.error('Error updating statistics:', error);
        utils.showAlert('Error updating statistics', 'danger');
    }
}

// Update the family member selection handler
async function handleFamilyMemberChange(memberId, members) {
    try {
        console.log('Family member change:', { memberId, members });
        currentFamilyMember = members.find(m => m.id === memberId);
        console.log('Selected family member:', currentFamilyMember);

        if (currentFamilyMember) {
            await Promise.all([
                loadExpenses(),
                loadMiles(),
                loadHours(),
                updateStatistics()
            ]);
        } else {
            // Clear the lists if no family member is selected
            document.getElementById('expenseList').innerHTML = '';
            document.getElementById('milesList').innerHTML = '';
            document.getElementById('hoursList').innerHTML = '';
            document.getElementById('totalExpenses').textContent = '$0.00';
            document.getElementById('totalMiles').textContent = '0 miles';
            document.getElementById('totalHours').textContent = '0 hours';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        utils.showAlert('Error loading data', 'danger');
    }
}

// Add this function to update user profile display
async function updateUserProfile(user) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) {
        userName.textContent = user.user_metadata?.full_name || user.email;
    }
    
    if (userAvatar) {
        // Set default avatar if none exists
        userAvatar.src = user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
        userAvatar.alt = user.user_metadata?.full_name || 'User';
    }
}

// Update handleLogout function
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        // Show auth container and hide app container
        document.getElementById('authContainer').classList.remove('d-none');
        document.getElementById('appContainer').classList.add('d-none');
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        utils.showAlert(error.message, 'danger');
    }
}

// Add retry mechanism
async function retryOperation(operation, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    throw lastError;
}

// Add form protection
function protectForm(form) {
    let hasUnsavedChanges = false;
    
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });
    
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    form.addEventListener('submit', () => {
        hasUnsavedChanges = false;
    });
}

// Apply to all forms
document.querySelectorAll('form').forEach(protectForm);

// Add simple cache
const cache = {
    data: new Map(),
    timeouts: new Map(),
    
    set(key, value, ttl = 60000) {
        this.data.set(key, value);
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
        }
        this.timeouts.set(key, setTimeout(() => this.data.delete(key), ttl));
    },
    
    get(key) {
        return this.data.get(key);
    },
    
    clear() {
        this.data.clear();
        this.timeouts.forEach(clearTimeout);
        this.timeouts.clear();
    }
};

// Add new family member function
async function addFamilyMember(name, relation) {
    try {
        const { data, error } = await supabase
            .from('family_members')
            .insert([
                {
                    user_id: state.currentUser.id,
                    name: name,
                    relation: relation,
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) throw error;

        utils.showAlert('Family member added successfully!', 'success');
        await loadFamilyMembers();
        return data[0];
    } catch (error) {
        console.error('Error adding family member:', error);
        utils.showAlert(error.message, 'danger');
        return null;
    }
}

// Add this function to handle the Add Family Member modal
async function handleAddFamilyMember() {
    const nameInput = document.getElementById('familyMemberName');
    const relationInput = document.getElementById('familyMemberRelation');
    const modal = bootstrap.Modal.getInstance(document.getElementById('addFamilyMemberModal'));

    const name = nameInput.value.trim();
    const relation = relationInput.value;

    if (!name || !relation) {
        utils.showAlert('Please fill in all fields', 'warning');
        return;
    }

    try {
        const newMember = await addFamilyMember(name, relation);
        if (newMember) {
            modal.hide();
            nameInput.value = '';
            relationInput.value = '';
        }
    } catch (error) {
        console.error('Error adding family member:', error);
        utils.showAlert(error.message, 'danger');
    }
}

// Rest of your app.js code... 