// Django Backend Application Logic

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
            if (session && session.user) {
                currentUser = session.user;
                app.state.currentUser = session.user;
                await updateUserProfile(session.user);
                await loadFamilyMembers();
                await updateStatistics();
            }
            resolve();
        } catch (error) {
            console.error('Error initializing app:', error);
            app.utils.showAlert('Error initializing application', 'danger');
            reject(error);
        }
    });
}

// Reset app state
function resetAppState() {
    currentUser = null;
    currentFamilyMember = null;
    app.state.currentUser = null;
    app.state.currentFamilyMember = null;
    
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
});

// Expense functions
async function loadExpenses() {
    if (!currentFamilyMember) return;

    try {
        const data = await window.djangoData.getExpenses(currentFamilyMember.id);
        
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
        app.utils.showAlert('Error loading expenses', 'danger');
    }
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
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }

    const form = event.target;
    const description = form.querySelector('#expenseDesc').value.trim();
    const amount = parseFloat(form.querySelector('#expenseAmount').value);

    if (!validateDescription(description)) {
        app.utils.showAlert('Description must be between 3 and 200 characters', 'warning');
        return;
    }

    if (!validateAmount(amount)) {
        app.utils.showAlert('Amount must be between 0 and 1,000,000', 'warning');
        return;
    }

    try {
        setLoading(true);
        console.log('Submitting expense for family member:', currentFamilyMember);

        const expenseData = {
            description: description,
            amount: amount,
            family_member: currentFamilyMember.id
        };

        const data = await window.djangoData.createExpense(expenseData);

        console.log('Expense added:', data);
        app.utils.showAlert('Expense added successfully!', 'success');
        form.reset();
        
        await Promise.all([
            loadExpenses(),
            updateStatistics()
        ]);
    } catch (error) {
        console.error('Error adding expense:', error);
        app.utils.showAlert(`Error: ${error.message}`, 'danger');
    } finally {
        setLoading(false);
    }
}

// Miles functions
async function loadMiles() {
    if (!currentFamilyMember) return;

    try {
        const data = await window.djangoData.getMiles(currentFamilyMember.id);
        
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
        app.utils.showAlert(error.message, 'danger');
    }
}

async function handleMilesSubmit(event) {
    event.preventDefault();
    
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }

    const form = event.target;
    const description = form.querySelector('#milesDesc').value;
    const miles = parseFloat(form.querySelector('#milesAmount').value);

    if (!description || isNaN(miles)) {
        app.utils.showAlert('Please enter valid description and miles', 'danger');
        return;
    }

    try {
        const mileData = {
            description: description,
            miles: miles,
            family_member: currentFamilyMember.id
        };

        const data = await window.djangoData.createMile(mileData);

        app.utils.showAlert('Miles added successfully!', 'success');
        form.reset();
        
        // Reload data and update statistics
        await Promise.all([
            loadMiles(),
            updateStatistics()
        ]);
    } catch (error) {
        console.error('Error adding miles:', error);
        app.utils.showAlert(error.message, 'danger');
    }
}

// Hours functions
async function loadHours() {
    if (!currentFamilyMember) return;

    try {
        const data = await window.djangoData.getHours(currentFamilyMember.id);

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
        app.utils.showAlert(error.message, 'danger');
    }
}

async function handleHoursSubmit(event) {
    event.preventDefault();
    
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }

    const form = event.target;
    const description = form.querySelector('#hoursDesc').value;
    const hours = parseFloat(form.querySelector('#hoursAmount').value);

    if (!description || isNaN(hours)) {
        app.utils.showAlert('Please enter valid description and hours', 'danger');
        return;
    }

    try {
        const hourData = {
            description: description,
            hours: hours,
            family_member: currentFamilyMember.id
        };

        const data = await window.djangoData.createHour(hourData);

        app.utils.showAlert('Hours added successfully!', 'success');
        form.reset();
        
        // Reload data and update statistics
        await Promise.all([
            loadHours(),
            updateStatistics()
        ]);
    } catch (error) {
        console.error('Error adding hours:', error);
        app.utils.showAlert(error.message, 'danger');
    }
}

// Family member functions
async function loadFamilyMembers() {
    try {
        const data = await window.djangoData.getFamilyMembers();

        const select = document.getElementById('familyMemberSelect');
        if (select && Array.isArray(data)) {
            select.innerHTML = '<option value="">Select Family Member</option>' +
                data.map(member => {
                    const status = member.is_registered ? '✓ Registered' : '○ Pending';
                    const emailInfo = member.email ? ` - ${member.email}` : '';
                    return `<option value="${member.id}">${member.name} (${member.relation}) - ${status}${emailInfo}</option>`;
                }).join('');

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
        app.utils.showAlert('Failed to load family members', 'danger');
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
        const stats = await window.djangoData.getStatistics(currentFamilyMember.id);

        // Update UI
        document.getElementById('totalExpenses').textContent = `$${stats.total_expenses.toFixed(2)}`;
        document.getElementById('totalMiles').textContent = `${stats.total_miles.toFixed(1)} miles`;
        document.getElementById('totalHours').textContent = `${stats.total_hours.toFixed(1)} hours`;
    } catch (error) {
        console.error('Error updating statistics:', error);
        app.utils.showAlert('Error updating statistics', 'danger');
    }
}

// Update the family member selection handler
async function handleFamilyMemberChange(memberId, members) {
    try {
        console.log('Family member change:', { memberId, members });
        currentFamilyMember = members.find(m => m.id == memberId);
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
        app.utils.showAlert('Error loading data', 'danger');
    }
}

// Add this function to update user profile display
async function updateUserProfile(user) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) {
        userName.textContent = user.first_name && user.last_name ? 
            `${user.first_name} ${user.last_name}` : user.username;
    }
    
    if (userAvatar) {
        // Set default avatar if none exists
        userAvatar.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
        userAvatar.alt = user.first_name || user.username;
    }
}

// Add new family member function
async function addFamilyMember(memberData) {
    try {
        const data = await window.djangoData.createFamilyMember(memberData);
        await loadFamilyMembers();
        return data;
    } catch (error) {
        console.error('Error adding family member:', error);
        throw error;
    }
}

// Add this function to handle the Add Family Member modal
async function handleAddFamilyMember() {
    const nameInput = document.getElementById('familyMemberName');
    const relationInput = document.getElementById('familyMemberRelation');
    const emailInput = document.getElementById('familyMemberEmail');
    const modal = bootstrap.Modal.getInstance(document.getElementById('addFamilyMemberModal'));

    const name = nameInput.value.trim();
    const relation = relationInput.value;
    const email = emailInput.value.trim();

    if (!name || !relation) {
        app.utils.showAlert('Please fill in all required fields', 'warning');
        return;
    }

    try {
        const memberData = {
            name: name,
            relation: relation,
            email: email || null
        };
        
        const newMember = await addFamilyMember(memberData);
        if (newMember) {
            modal.hide();
            nameInput.value = '';
            relationInput.value = '';
            emailInput.value = '';
            
            // Show success message with email info
            if (email) {
                app.utils.showAlert(`Family member "${name}" added successfully! Email invite will be sent to ${email}`, 'success');
            } else {
                app.utils.showAlert(`Family member "${name}" added successfully!`, 'success');
            }
        }
    } catch (error) {
        console.error('Error adding family member:', error);
        app.utils.showAlert(error.message, 'danger');
    }
}

// Export/Import Functions
async function exportToExcel() {
    try {
        const year = document.getElementById('exportYear').value;
        const response = await fetch(`${window.APP_CONFIG?.API_BASE_URL}/export/?format=excel&year=${year}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `family_transactions_${year}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            app.utils.showAlert('Excel file exported successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        app.utils.showAlert('Export failed: ' + error.message, 'danger');
    }
}

async function exportToCSV() {
    try {
        const year = document.getElementById('exportYear').value;
        const response = await fetch(`${window.APP_CONFIG?.API_BASE_URL}/export/?format=csv&year=${year}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `family_transactions_${year}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            app.utils.showAlert('CSV file exported successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        app.utils.showAlert('Export failed: ' + error.message, 'danger');
    }
}

async function importTransactions(fileInput) {
    if (!fileInput.files[0]) return;
    
    const file = fileInput.files[0];
    const familyMemberSelect = document.getElementById('familyMemberSelect');
    
    if (!familyMemberSelect.value) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('family_member_id', familyMemberSelect.value);
        
        const response = await fetch(`${window.APP_CONFIG?.API_BASE_URL}/import/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            app.utils.showAlert(result.message, 'success');
            if (result.errors && result.errors.length > 0) {
                console.warn('Import errors:', result.errors);
            }
            // Reload data
            await loadFamilyMembers();
            await loadExpenses();
            await loadMiles();
            await loadHours();
            await updateStatistics();
        } else {
            throw new Error(result.error || 'Import failed');
        }
    } catch (error) {
        console.error('Import error:', error);
        app.utils.showAlert('Import failed: ' + error.message, 'danger');
    }
}

async function generateTaxReport() {
    try {
        const year = document.getElementById('exportYear').value;
        const response = await fetch(`${window.APP_CONFIG?.API_BASE_URL}/tax-report/?year=${year}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        const taxData = await response.json();
        
        if (response.ok) {
            displayTaxReport(taxData);
        } else {
            throw new Error('Tax report generation failed');
        }
    } catch (error) {
        console.error('Tax report error:', error);
        app.utils.showAlert('Tax report failed: ' + error.message, 'danger');
    }
}

function displayTaxReport(taxData) {
    const taxAnalysis = document.getElementById('taxAnalysis');
    
    let html = `
        <div class="tax-report">
            <h6>AI Tax Analysis for ${taxData.year}</h6>
            <div class="row">
                <div class="col-md-6">
                    <strong>Total Deductible: $${taxData.total_deductible.toFixed(2)}</strong>
                </div>
                <div class="col-md-6">
                    <strong>Forms Needed: ${taxData.forms_needed.join(', ')}</strong>
                </div>
            </div>
            <div class="mt-2">
                <h6>Categories:</h6>
                <ul class="list-unstyled">
    `;
    
    for (const [category, data] of Object.entries(taxData.categories)) {
        html += `
            <li>
                <strong>${category}:</strong> 
                $${data.total.toFixed(2)} 
                (${data.count} transactions)
                ${data.deductible > 0 ? `<span class="text-success">- $${data.deductible.toFixed(2)} deductible</span>` : ''}
            </li>
        `;
    }
    
    html += `
                </ul>
            </div>
            <div class="mt-2">
                <h6>AI Recommendations:</h6>
                <ul>
    `;
    
    taxData.recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
    });
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    taxAnalysis.innerHTML = html;
    
    // Update tax deductions display
    document.getElementById('totalDeductions').textContent = `$${taxData.total_deductible.toFixed(2)}`;
    
    app.utils.showAlert('Tax report generated successfully!', 'success');
}

// Make export/import functions globally available
window.exportToExcel = exportToExcel;
window.exportToCSV = exportToCSV;
window.importTransactions = importTransactions;
window.generateTaxReport = generateTaxReport;
