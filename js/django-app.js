// Django Backend Application Logic

// Global state (local to this module)
let currentUser = null;
let currentFamilyMember = null;
let isLoading = false;
let allExpenses = [];
let allMiles = [];
let allHours = [];

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

// Utility function to create edit modal
function createEditModal(type, data) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editModal';
    modal.setAttribute('tabindex', '-1');
    
    const fields = {
        expense: [
            { name: 'description', label: 'Description', type: 'text', value: data.description },
            { name: 'amount', label: 'Amount ($)', type: 'number', value: data.amount, step: '0.01' }
        ],
        mile: [
            { name: 'description', label: 'Description', type: 'text', value: data.description },
            { name: 'miles', label: 'Miles', type: 'number', value: data.miles, step: '0.1' }
        ],
        hour: [
            { name: 'description', label: 'Description', type: 'text', value: data.description },
            { name: 'hours', label: 'Hours', type: 'number', value: data.hours, step: '0.5' }
        ]
    };
    
    const currentFields = fields[type] || fields.expense;
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit ${type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="editForm">
                        ${currentFields.map(field => `
                            <div class="mb-3">
                                <label class="form-label">${field.label}</label>
                                <input type="${field.type}" class="form-control" name="${field.name}" 
                                       value="${field.value}" ${field.step ? `step="${field.step}"` : ''} required>
                            </div>
                        `).join('')}
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" form="editForm" class="btn btn-primary">Update</button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

// Edit and Delete functions for expenses
async function editExpense(expenseId) {
    try {
        // Get current expense data
        const expenses = await window.djangoData.getExpenses(currentFamilyMember.id);
        const expense = expenses.find(e => e.id === expenseId);
        
        if (!expense) {
            app.utils.showAlert('Expense not found', 'danger');
            return;
        }
        
        // Create edit modal
        const editModal = createEditModal('expense', expense);
        document.body.appendChild(editModal);
        
        // Show modal
        const modal = new bootstrap.Modal(editModal);
        modal.show();
        
        // Handle form submission
        const form = editModal.querySelector('#editForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedData = {
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                family_member: currentFamilyMember.id
            };
            
            try {
                await window.djangoData.updateExpense(expenseId, updatedData);
                app.utils.showAlert('Expense updated successfully!', 'success');
                modal.hide();
                await loadExpenses();
                await updateStatistics();
            } catch (error) {
                app.utils.showAlert(`Error updating expense: ${error.message}`, 'danger');
            }
        });
        
    } catch (error) {
        console.error('Error editing expense:', error);
        app.utils.showAlert('Error loading expense details', 'danger');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    console.log('Attempting to delete expense with ID:', expenseId);
    console.log('Current family member:', currentFamilyMember);
    
    try {
        // Check if we have a valid family member
        if (!currentFamilyMember) {
            throw new Error('No family member selected');
        }
        
        // Check if the expense exists in our local data
        const expense = allExpenses.find(exp => exp.id == expenseId);
        if (!expense) {
            throw new Error(`Expense with ID ${expenseId} not found in local data`);
        }
        
        console.log('Found expense to delete:', expense);
        
        // Try to delete via API
        await window.djangoData.deleteExpense(expenseId);
        console.log('Expense deleted successfully via API');
        
        app.utils.showAlert('Expense deleted successfully!', 'success');
        
        // Reload data
        await loadExpenses();
        await updateStatistics();
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        console.error('Error details:', {
            expenseId,
            currentFamilyMember,
            allExpenses: allExpenses.length,
            error: error.message
        });
        
        // Try to remove from local data as fallback
        try {
            console.log('Attempting to remove from local data as fallback...');
            allExpenses = allExpenses.filter(exp => exp.id != expenseId);
            displayExpenses(allExpenses);
            updateStatistics();
            app.utils.showAlert('Expense removed from local data (API delete failed)', 'warning');
        } catch (fallbackError) {
            console.error('Fallback removal also failed:', fallbackError);
            app.utils.showAlert(`Error deleting expense: ${error.message}`, 'danger');
        }
    }
}

// Make functions available globally
window.appFunctions = {
    initialize: initializeApp,
    reset: resetAppState,
    addFamilyMember: addFamilyMember,
    handleAddFamilyMember: handleAddFamilyMember
};

// Edit and Delete functions for miles
async function editMile(mileId) {
    try {
        const miles = await window.djangoData.getMiles(currentFamilyMember.id);
        const mile = miles.find(m => m.id === mileId);
        
        if (!mile) {
            app.utils.showAlert('Mile record not found', 'danger');
            return;
        }
        
        const editModal = createEditModal('mile', mile);
        document.body.appendChild(editModal);
        
        const modal = new bootstrap.Modal(editModal);
        modal.show();
        
        const form = editModal.querySelector('#editForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedData = {
                description: formData.get('description'),
                miles: parseFloat(formData.get('miles')),
                family_member: currentFamilyMember.id
            };
            
            try {
                await window.djangoData.updateMile(mileId, updatedData);
                app.utils.showAlert('Mile record updated successfully!', 'success');
                modal.hide();
                await loadMiles();
                await updateStatistics();
            } catch (error) {
                app.utils.showAlert(`Error updating mile record: ${error.message}`, 'danger');
            }
        });
        
    } catch (error) {
        console.error('Error editing mile:', error);
        app.utils.showAlert('Error loading mile details', 'danger');
    }
}

async function deleteMile(mileId) {
    if (!confirm('Are you sure you want to delete this mile record?')) {
        return;
    }
    
    try {
        await window.djangoData.deleteMile(mileId);
        app.utils.showAlert('Mile record deleted successfully!', 'success');
        await loadMiles();
        await updateStatistics();
    } catch (error) {
        console.error('Error deleting mile:', error);
        app.utils.showAlert(`Error deleting mile record: ${error.message}`, 'danger');
    }
}

// Edit and Delete functions for hours
async function editHour(hourId) {
    try {
        const hours = await window.djangoData.getHours(currentFamilyMember.id);
        const hour = hours.find(h => h.id === hourId);
        
        if (!hour) {
            app.utils.showAlert('Hour record not found', 'danger');
            return;
        }
        
        const editModal = createEditModal('hour', hour);
        document.body.appendChild(editModal);
        
        const modal = new bootstrap.Modal(editModal);
        modal.show();
        
        const form = editModal.querySelector('#editForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedData = {
                description: formData.get('description'),
                hours: parseFloat(formData.get('hours')),
                family_member: currentFamilyMember.id
            };
            
            try {
                await window.djangoData.updateHour(hourId, updatedData);
                app.utils.showAlert('Hour record updated successfully!', 'success');
                modal.hide();
                await loadHours();
                await updateStatistics();
            } catch (error) {
                app.utils.showAlert(`Error updating hour record: ${error.message}`, 'danger');
            }
        });
        
    } catch (error) {
        console.error('Error editing hour:', error);
        app.utils.showAlert('Error loading hour details', 'danger');
    }
}

async function deleteHour(hourId) {
    if (!confirm('Are you sure you want to delete this hour record?')) {
        return;
    }
    
    try {
        await window.djangoData.deleteHour(hourId);
        app.utils.showAlert('Hour record deleted successfully!', 'success');
        await loadHours();
        await updateStatistics();
    } catch (error) {
        console.error('Error deleting hour:', error);
        app.utils.showAlert(`Error deleting hour record: ${error.message}`, 'danger');
    }
}

// Search and filter functions
function filterExpenses(searchTerm) {
    const filtered = allExpenses.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm)
    );
    displayExpenses(filtered);
}

function filterMiles(searchTerm) {
    const filtered = allMiles.filter(mile => 
        mile.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mile.miles.toString().includes(searchTerm)
    );
    displayMiles(filtered);
}

function filterHours(searchTerm) {
    const filtered = allHours.filter(hour => 
        hour.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hour.hours.toString().includes(searchTerm)
    );
    displayHours(filtered);
}

function displayExpenses(expenses) {
        console.log('Displaying expenses:', expenses);
        const expenseList = document.getElementById('expenseList');
        if (expenseList) {
            console.log('Expense list element found');
        if (Array.isArray(expenses) && expenses.length > 0) {
            console.log('Expenses array is valid, length:', expenses.length);
            expenseList.innerHTML = expenses.map(expense => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                            <h6 class="mb-0">${expense.description}</h6>
                            <small class="date-badge">
                                <i class="far fa-calendar-alt me-1"></i>
                                ${new Date(expense.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="amount-badge bg-primary text-white">
                            $${parseFloat(expense.amount).toFixed(2)}
                        </span>
                        <button class="btn btn-sm btn-outline-primary" onclick="editExpense(${expense.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${expense.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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
}

function displayMiles(miles) {
    const milesList = document.getElementById('milesList');
    if (milesList) {
        if (Array.isArray(miles) && miles.length > 0) {
            milesList.innerHTML = miles.map(mile => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${mile.description}</h6>
                        <small class="text-muted">
                            <i class="far fa-calendar-alt me-1"></i>
                            ${new Date(mile.created_at).toLocaleDateString()}
                        </small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-success">${parseFloat(mile.miles).toFixed(1)} miles</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="editMile(${mile.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMile(${mile.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        } else {
            milesList.innerHTML = '<li class="list-group-item">No miles recorded</li>';
        }
    }
}

function displayHours(hours) {
    const hoursList = document.getElementById('hoursList');
    if (hoursList) {
        if (Array.isArray(hours) && hours.length > 0) {
            hoursList.innerHTML = hours.map(hour => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${hour.description}</h6>
                        <small class="text-muted">
                            <i class="far fa-calendar-alt me-1"></i>
                            ${new Date(hour.created_at).toLocaleDateString()}
                        </small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-warning">${parseFloat(hour.hours).toFixed(1)} hours</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="editHour(${hour.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteHour(${hour.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        } else {
            hoursList.innerHTML = '<li class="list-group-item">No hours recorded</li>';
        }
    }
}

// Clear search functions
function clearExpenseSearch() {
    document.getElementById('expenseSearch').value = '';
    displayExpenses(allExpenses);
}

function clearMilesSearch() {
    document.getElementById('milesSearch').value = '';
    displayMiles(allMiles);
}

function clearHoursSearch() {
    document.getElementById('hoursSearch').value = '';
    displayHours(allHours);
}

// Make edit/delete functions globally available
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.editMile = editMile;
window.deleteMile = deleteMile;
window.editHour = editHour;
window.deleteHour = deleteHour;
window.clearExpenseSearch = clearExpenseSearch;
window.clearMilesSearch = clearMilesSearch;
window.clearHoursSearch = clearHoursSearch;

// Reporting and Export Functions
let expenseChart = null;

async function loadReportsData() {
    if (!currentFamilyMember) return;
    
    try {
        // Load all data for reporting
        const [expenses, miles, hours, statistics] = await Promise.all([
            window.djangoData.getExpenses(currentFamilyMember.id),
            window.djangoData.getMiles(currentFamilyMember.id),
            window.djangoData.getHours(currentFamilyMember.id),
            window.djangoData.getStatistics(currentFamilyMember.id)
        ]);
        
        // Update report summary cards
        console.log('Statistics data:', statistics);
        if (statistics) {
            updateReportSummary(statistics);
        } else {
            console.warn('No statistics data received');
            updateReportSummary({});
        }
        
        // Create expense chart - ensure we have an array
        const expensesForChart = Array.isArray(expenses) ? expenses : (expenses?.results || []);
        createExpenseChart(expensesForChart);
        
        // Update recent activity - ensure we have arrays
        const expensesArray = Array.isArray(expenses) ? expenses : (expenses?.results || []);
        const milesArray = Array.isArray(miles) ? miles : (miles?.results || []);
        const hoursArray = Array.isArray(hours) ? hours : (hours?.results || []);
        updateRecentActivity(expensesArray, milesArray, hoursArray);
        
    } catch (error) {
        console.error('Error loading reports data:', error);
        app.utils.showAlert('Error loading reports data', 'danger');
    }
}

function updateReportSummary(stats) {
    // Safely handle undefined or null values
    const totalExpenses = stats?.total_expenses || 0;
    const totalMiles = stats?.total_miles || 0;
    const totalHours = stats?.total_hours || 0;
    const totalDeductions = stats?.total_deductions || 0;
    
    document.getElementById('reportTotalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('reportTotalMiles').textContent = `${totalMiles} miles`;
    document.getElementById('reportTotalHours').textContent = `${totalHours} hours`;
    document.getElementById('reportTaxDeductions').textContent = `$${totalDeductions.toFixed(2)}`;
}

function createExpenseChart(expenses) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    // Ensure expenses is an array
    if (!Array.isArray(expenses)) {
        console.warn('Expenses data is not an array:', expenses);
        expenses = [];
    }
    
    // Destroy existing chart
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    // Group expenses by description for pie chart
    const expenseGroups = {};
    expenses.forEach(expense => {
        const key = expense.description;
        if (expenseGroups[key]) {
            expenseGroups[key] += parseFloat(expense.amount);
        } else {
            expenseGroups[key] = parseFloat(expense.amount);
        }
    });
    
    const labels = Object.keys(expenseGroups);
    const data = Object.values(expenseGroups);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateRecentActivity(expenses, miles, hours) {
    const container = document.getElementById('recentActivitySummary');
    if (!container) return;
    
    // Get recent items (last 10)
    const allItems = [
        ...expenses.slice(0, 5).map(item => ({
            ...item,
            type: 'expense',
            icon: 'fas fa-receipt',
            color: 'text-primary',
            value: `$${parseFloat(item.amount).toFixed(2)}`
        })),
        ...miles.slice(0, 3).map(item => ({
            ...item,
            type: 'mile',
            icon: 'fas fa-road',
            color: 'text-success',
            value: `${parseFloat(item.miles).toFixed(1)} miles`
        })),
        ...hours.slice(0, 3).map(item => ({
            ...item,
            type: 'hour',
            icon: 'fas fa-clock',
            color: 'text-warning',
            value: `${parseFloat(item.hours).toFixed(1)} hours`
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
    
    if (allItems.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-info-circle me-2"></i>
                No recent activity found
            </div>
        `;
        return;
    }
    
    container.innerHTML = allItems.map(item => `
        <div class="d-flex align-items-center mb-2">
            <i class="${item.icon} ${item.color} me-3"></i>
            <div class="flex-grow-1">
                <div class="fw-bold">${item.description}</div>
                <small class="text-muted">${new Date(item.created_at).toLocaleDateString()}</small>
            </div>
            <span class="badge bg-light text-dark">${item.value}</span>
        </div>
    `).join('');
}

// Export Functions
function exportToCSV(type) {
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }
    
    let data = [];
    let filename = '';
    
    switch(type) {
        case 'expenses':
            data = allExpenses;
            filename = `expenses_${currentFamilyMember.name}_${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'miles':
            data = allMiles;
            filename = `miles_${currentFamilyMember.name}_${new Date().toISOString().split('T')[0]}.csv`;
            break;
        case 'hours':
            data = allHours;
            filename = `hours_${currentFamilyMember.name}_${new Date().toISOString().split('T')[0]}.csv`;
            break;
    }
    
    if (data.length === 0) {
        app.utils.showAlert(`No ${type} data to export`, 'warning');
        return;
    }
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    // Download file
    downloadCSV(csvContent, filename);
    app.utils.showAlert(`${type} data exported successfully!`, 'success');
}

function exportAllData() {
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }
    
    const allData = {
        expenses: allExpenses,
        miles: allMiles,
        hours: allHours,
        familyMember: currentFamilyMember,
        exportDate: new Date().toISOString()
    };
    
    const jsonContent = JSON.stringify(allData, null, 2);
    const filename = `family_bookkeeping_${currentFamilyMember.name}_${new Date().toISOString().split('T')[0]}.json`;
    
    downloadJSON(jsonContent, filename);
    app.utils.showAlert('All data exported successfully!', 'success');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadJSON(content, filename) {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        app.utils.showAlert('Please select both start and end dates', 'warning');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        app.utils.showAlert('Start date must be before end date', 'warning');
        return;
    }
    
    // Filter data by date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.created_at);
        return expenseDate >= start && expenseDate <= end;
    });
    
    const filteredMiles = allMiles.filter(mile => {
        const mileDate = new Date(mile.created_at);
        return mileDate >= start && mileDate <= end;
    });
    
    const filteredHours = allHours.filter(hour => {
        const hourDate = new Date(hour.created_at);
        return hourDate >= start && hourDate <= end;
    });
    
    // Create date range report
    const reportData = {
        dateRange: { start: startDate, end: endDate },
        expenses: filteredExpenses,
        miles: filteredMiles,
        hours: filteredHours,
        summary: {
            totalExpenses: filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
            totalMiles: filteredMiles.reduce((sum, mile) => sum + parseFloat(mile.miles), 0),
            totalHours: filteredHours.reduce((sum, hour) => sum + parseFloat(hour.hours), 0)
        }
    };
    
    const jsonContent = JSON.stringify(reportData, null, 2);
    const filename = `report_${currentFamilyMember.name}_${startDate}_to_${endDate}.json`;
    
    downloadJSON(jsonContent, filename);
    app.utils.showAlert(`Report generated for ${startDate} to ${endDate}!`, 'success');
}

// Family Member Management Functions
async function loadFamilyMembersList() {
    try {
        console.log('Loading family members list...');
        const response = await window.djangoData.getFamilyMembers();
        console.log('Family members list response:', response);
        
        // Handle paginated response
        const data = response.results || response;
        console.log('Family members list data (processed):', data);
        
        const container = document.getElementById('familyMembersList');
        if (container) {
            if (Array.isArray(data) && data.length > 0) {
                console.log('Displaying family members in list:', data.length);
                container.innerHTML = data.map(member => `
                    <div class="d-flex justify-content-between align-items-center mb-3 p-3 border rounded">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${member.name}</h6>
                            <small class="text-muted">${member.relation}</small>
                            ${member.email ? `<br><small class="text-info"><i class="fas fa-envelope me-1"></i>${member.email}</small>` : ''}
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="editFamilyMember(${member.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteFamilyMember(${member.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                console.log('No family members found for list');
                container.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-info-circle me-2"></i>
                        No family members found. Add one above.
                    </div>
                `;
            }
        } else {
            console.log('Family members list container not found');
        }
        
        // Update report recipient dropdown
        console.log('Calling updateReportRecipients with data:', data);
        updateReportRecipients(data);
        
    } catch (error) {
        console.error('Error loading family members:', error);
        app.utils.showAlert('Error loading family members', 'danger');
    }
}

function updateReportRecipients(familyMembers) {
    console.log('updateReportRecipients called with:', familyMembers);
    console.log('Is array:', Array.isArray(familyMembers));
    
    const select = document.getElementById('reportRecipient');
    if (select) {
        if (Array.isArray(familyMembers)) {
            select.innerHTML = '<option value="">Select Family Member</option>' +
                familyMembers.filter(member => member.email).map(member => `
                    <option value="${member.id}">${member.name} (${member.email})</option>
                `).join('');
        } else {
            console.log('familyMembers is not an array, skipping update');
            select.innerHTML = '<option value="">Select Family Member</option>';
        }
    } else {
        console.log('Report recipient select element not found');
    }
}

async function addFamilyMember() {
    console.log('addFamilyMember function called');
    
    // Debug: Check all elements with these IDs
    console.log('All elements with familyMemberName:', document.querySelectorAll('#familyMemberName'));
    console.log('All elements with familyMemberRelation:', document.querySelectorAll('#familyMemberRelation'));
    console.log('All elements with familyMemberEmail:', document.querySelectorAll('#familyMemberEmail'));
    console.log('All elements with sendReports:', document.querySelectorAll('#sendReports'));
    console.log('All elements with grantAccess:', document.querySelectorAll('#grantAccess'));
    
    // Get form elements
    const nameInput = document.getElementById('familyMemberName');
    const relationInput = document.getElementById('familyMemberRelation');
    const emailInput = document.getElementById('familyMemberEmail');
    const sendReportsCheckbox = document.getElementById('sendReports');
    const grantAccessCheckbox = document.getElementById('grantAccess');
    
    console.log('Form elements found:', {
        nameInput: !!nameInput,
        relationInput: !!relationInput,
        emailInput: !!emailInput,
        sendReportsCheckbox: !!sendReportsCheckbox,
        grantAccessCheckbox: !!grantAccessCheckbox
    });
    
    // Validate elements exist
    if (!nameInput || !relationInput || !emailInput || !sendReportsCheckbox || !grantAccessCheckbox) {
        console.error('Form elements not found:', {
            nameInput: !!nameInput,
            relationInput: !!relationInput,
            emailInput: !!emailInput,
            sendReportsCheckbox: !!sendReportsCheckbox,
            grantAccessCheckbox: !!grantAccessCheckbox
        });
        app.utils.showAlert('Form elements not found. Please refresh the page.', 'danger');
        return;
    }
    
    // Get values
    const name = nameInput ? nameInput.value.trim() : '';
    const relation = relationInput ? relationInput.value : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const sendReports = sendReportsCheckbox ? sendReportsCheckbox.checked : false;
    const grantAccess = grantAccessCheckbox ? grantAccessCheckbox.checked : false;
    
    // Fallback: Try to get data from form directly
    if (!name || !relation) {
        console.log('Trying fallback method - getting data from form element');
        const form = document.getElementById('familyMemberForm');
        if (form) {
            const formData = new FormData(form);
            console.log('Form data from FormData:', {
                name: formData.get('name') || formData.get('familyMemberName'),
                relation: formData.get('relation') || formData.get('familyMemberRelation'),
                email: formData.get('email') || formData.get('familyMemberEmail'),
                sendReports: formData.get('sendReports') === 'on',
                grantAccess: formData.get('grantAccess') === 'on'
            });
        }
    }
    
    console.log('Form values:', { name, relation, email, sendReports, grantAccess });
    console.log('Main form element values:', {
        nameInput: nameInput.value,
        relationInput: relationInput.value,
        emailInput: emailInput.value,
        sendReportsCheckbox: sendReportsCheckbox.checked,
        grantAccessCheckbox: grantAccessCheckbox.checked
    });
    
    // Validate required fields
    if (!name) {
        app.utils.showAlert('Please enter a name', 'warning');
        nameInput.focus();
        return;
    }
    
    if (!relation) {
        app.utils.showAlert('Please select a relation', 'warning');
        relationInput.focus();
        return;
    }
    
    // Validate email format if provided
    if (email && !isValidEmail(email)) {
        app.utils.showAlert('Please enter a valid email address', 'warning');
        emailInput.focus();
        return;
    }
    
    try {
        const memberData = {
            name: name,
            relation: relation,
            email: email || null,
            is_registered: grantAccess,
            send_reports: sendReports,
            role: 'member', // Default role for new family members
            can_view_all: false // Default to false for new members
        };
        
        console.log('Sending family member data:', memberData);
        console.log('Data type check:', {
            name: typeof memberData.name,
            relation: typeof memberData.relation,
            email: typeof memberData.email,
            is_registered: typeof memberData.is_registered,
            send_reports: typeof memberData.send_reports,
            role: typeof memberData.role,
            can_view_all: typeof memberData.can_view_all
        });
        const response = await window.djangoData.createFamilyMember(memberData);
        console.log('Family member creation response:', response);
        app.utils.showAlert('Family member added successfully!', 'success');
        
        // Send welcome email if email is provided
        if (email && sendReports) {
            try {
                await window.djangoData.sendWelcomeEmail(email, name);
                app.utils.showAlert(`Welcome email sent to ${email}!`, 'success');
            } catch (error) {
                console.error('Error sending welcome email:', error);
                app.utils.showAlert('Family member added, but welcome email failed to send', 'warning');
            }
        }
        
        // Clear form
        document.getElementById('familyMemberForm').reset();
        
        // Reload family members
        await loadFamilyMembersList();
        await loadFamilyMembers(); // Update the main dropdown
        
    } catch (error) {
        console.error('Error adding family member:', error);
        
        // Extract more specific error message
        let errorMessage = error.message;
        if (error.message.includes('HTTP 400')) {
            errorMessage = 'Invalid data provided. Please check all fields and try again.';
        } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('HTTP 401')) {
            errorMessage = 'Authentication required. Please login again.';
        }
        
        app.utils.showAlert(`Error adding family member: ${errorMessage}`, 'danger');
    }
}

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function editFamilyMember(memberId) {
    try {
        const response = await window.djangoData.getFamilyMembers();
        console.log('Edit family member response:', response);
        
        // Handle paginated response
        const familyMembers = response.results || response;
        console.log('Edit family member data (processed):', familyMembers);
        
        if (!Array.isArray(familyMembers)) {
            console.error('Family members is not an array:', familyMembers);
            app.utils.showAlert('Error loading family members data', 'danger');
            return;
        }
        
        const member = familyMembers.find(m => m.id === memberId);
        
        if (!member) {
            app.utils.showAlert('Family member not found', 'danger');
            return;
        }
        
        // Create edit modal
        const editModal = createFamilyMemberEditModal(member);
        document.body.appendChild(editModal);
        
        const modal = new bootstrap.Modal(editModal);
        modal.show();
        
        const form = editModal.querySelector('#editFamilyMemberForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedData = {
                name: formData.get('name'),
                relation: formData.get('relation'),
                email: formData.get('email') || null,
                is_registered: formData.get('grantAccess') === 'on',
                send_reports: formData.get('sendReports') === 'on'
            };
            
            try {
                await window.djangoData.updateFamilyMember(memberId, updatedData);
                app.utils.showAlert('Family member updated successfully!', 'success');
                modal.hide();
                await loadFamilyMembersList();
                await loadFamilyMembers();
            } catch (error) {
                app.utils.showAlert(`Error updating family member: ${error.message}`, 'danger');
            }
        });
        
    } catch (error) {
        console.error('Error editing family member:', error);
        app.utils.showAlert('Error loading family member details', 'danger');
    }
}

async function deleteFamilyMember(memberId) {
    console.log('deleteFamilyMember called with ID:', memberId);
    
    if (!confirm('Are you sure you want to delete this family member?')) {
        console.log('User cancelled deletion');
        return;
    }
    
    try {
        console.log('Attempting to delete family member:', memberId);
        await window.djangoData.deleteFamilyMember(memberId);
        console.log('Family member deleted successfully');
        app.utils.showAlert('Family member deleted successfully!', 'success');
        await loadFamilyMembersList();
        await loadFamilyMembers();
    } catch (error) {
        console.error('Error deleting family member:', error);
        app.utils.showAlert(`Error deleting family member: ${error.message}`, 'danger');
    }
}

function createFamilyMemberEditModal(member) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editFamilyMemberModal';
    modal.setAttribute('tabindex', '-1');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Family Member</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="editFamilyMemberForm">
                        <div class="mb-3">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-control" name="name" value="${member.name}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Relation *</label>
                            <select class="form-control" name="relation" required>
                                <option value="Self" ${member.relation === 'Self' ? 'selected' : ''}>Self</option>
                                <option value="Spouse" ${member.relation === 'Spouse' ? 'selected' : ''}>Spouse</option>
                                <option value="Child" ${member.relation === 'Child' ? 'selected' : ''}>Child</option>
                                <option value="Parent" ${member.relation === 'Parent' ? 'selected' : ''}>Parent</option>
                                <option value="Sibling" ${member.relation === 'Sibling' ? 'selected' : ''}>Sibling</option>
                                <option value="Other" ${member.relation === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" name="email" value="${member.email || ''}" placeholder="family@example.com">
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="sendReports" ${member.send_reports ? 'checked' : ''}>
                                <label class="form-check-label">Send monthly reports to this email</label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="grantAccess" ${member.is_registered ? 'checked' : ''}>
                                <label class="form-check-label">Grant access to view/edit data</label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" form="editFamilyMemberForm" class="btn btn-primary">Update</button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

// Import/Export functions
async function importData() {
    const fileInput = document.getElementById('importFile');
    const dataType = document.getElementById('importDataType').value;
    const progressDiv = document.getElementById('importProgress');
    const resultsDiv = document.getElementById('importResults');
    
    if (!fileInput.files[0]) {
        app.utils.showAlert('Please select a file to import', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const fileName = file.name.toLowerCase();
    
    // Validate file type
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        app.utils.showAlert('Please select a CSV or Excel file', 'warning');
        return;
    }
    
    try {
        // Show progress
        progressDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        
        // Parse file based on type
        let data;
        if (fileName.endsWith('.csv')) {
            data = await parseCSV(file);
        } else {
            data = await parseExcel(file);
        }
        
        console.log('Parsed data:', data);
        
        // Validate data structure
        if (!validateImportData(data, dataType)) {
            throw new Error('Invalid data format for ' + dataType);
        }
        
        // Import data to backend
        const result = await importDataToBackend(data, dataType);
        
        // Show results
        showImportResults(result);
        
        // Refresh the current tab
        if (dataType === 'expenses') {
            loadExpenses();
        } else if (dataType === 'miles') {
            loadMiles();
        } else if (dataType === 'hours') {
            loadHours();
        }
        
        // Refresh reports if on reports tab
        if (document.getElementById('reports-tab').classList.contains('active')) {
            loadReportsData();
        }
        
    } catch (error) {
        console.error('Import error:', error);
        app.utils.showAlert(`Import failed: ${error.message}`, 'danger');
    } finally {
        progressDiv.style.display = 'none';
    }
}

async function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const data = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header.toLowerCase()] = values[index] || '';
                    });
                    data.push(row);
                }
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

async function parseExcel(file) {
    // For Excel files, we'll use a simple approach
    // In a real implementation, you'd use a library like SheetJS
    app.utils.showAlert('Excel import requires additional setup. Please use CSV format for now.', 'info');
    throw new Error('Excel import not yet implemented');
}

function validateImportData(data, dataType) {
    if (!Array.isArray(data) || data.length === 0) {
        return false;
    }
    
    const requiredFields = {
        'expenses': ['description', 'amount'],
        'miles': ['description', 'miles', 'rate'],
        'hours': ['description', 'hours', 'rate']
    };
    
    const fields = requiredFields[dataType];
    if (!fields) return false;
    
    // Check if first row has required fields
    const firstRow = data[0];
    return fields.every(field => firstRow.hasOwnProperty(field));
}

async function importDataToBackend(data, dataType) {
    const results = {
        success: 0,
        errors: 0,
        details: []
    };
    
    for (let i = 0; i < data.length; i++) {
        try {
            const row = data[i];
            let response;
            
            if (dataType === 'expenses') {
                response = await window.djangoData.createExpense({
                    description: row.description,
                    amount: parseFloat(row.amount),
                    family_member: currentFamilyMember.id
                });
            } else if (dataType === 'miles') {
                response = await window.djangoData.createMile({
                    description: row.description,
                    miles: parseFloat(row.miles),
                    rate: parseFloat(row.rate),
                    family_member: currentFamilyMember.id
                });
            } else if (dataType === 'hours') {
                response = await window.djangoData.createHour({
                    description: row.description,
                    hours: parseFloat(row.hours),
                    rate: parseFloat(row.rate),
                    family_member: currentFamilyMember.id
                });
            }
            
            results.success++;
            results.details.push(`Row ${i + 1}: Success`);
            
        } catch (error) {
            results.errors++;
            results.details.push(`Row ${i + 1}: ${error.message}`);
        }
    }
    
    return results;
}

function showImportResults(result) {
    const resultsDiv = document.getElementById('importResults');
    resultsDiv.style.display = 'block';
    
    const alertClass = result.errors === 0 ? 'alert-success' : 'alert-warning';
    
    resultsDiv.innerHTML = `
        <div class="alert ${alertClass}">
            <h6>Import Results</h6>
            <p><strong>Success:</strong> ${result.success} records</p>
            <p><strong>Errors:</strong> ${result.errors} records</p>
            ${result.details.length > 0 ? `<details><summary>Details</summary><ul>${result.details.map(d => `<li>${d}</li>`).join('')}</ul></details>` : ''}
        </div>
    `;
}

function downloadTemplate() {
    const dataType = document.getElementById('importDataType').value;
    
    let csvContent = '';
    let filename = '';
    
    if (dataType === 'expenses') {
        csvContent = 'description,amount\n"Sample Expense",25.50';
        filename = 'expenses_template.csv';
    } else if (dataType === 'miles') {
        csvContent = 'description,miles,rate\n"Business Trip",100,0.65';
        filename = 'miles_template.csv';
    } else if (dataType === 'hours') {
        csvContent = 'description,hours,rate\n"Consulting Work",8,50.00';
        filename = 'hours_template.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Mock data functions for testing - Linked with API
async function loadMockData() {
    console.log('Loading mock data for testing...');
    
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }
    
    try {
        // Create mock data using the same API functions
        const mockExpenses = [
            {
                description: "Gas Station",
                amount: 25.50,
                family_member: currentFamilyMember.id
            },
            {
                description: "Office Supplies", 
                amount: 15.75,
                family_member: currentFamilyMember.id
            },
            {
                description: "Business Lunch",
                amount: 45.00,
                family_member: currentFamilyMember.id
            }
        ];
        
        const mockMiles = [
            {
                description: "Business Trip to Client",
                miles: 150,
                rate: 0.65,
                family_member: currentFamilyMember.id
            },
            {
                description: "Office to Meeting",
                miles: 25,
                rate: 0.65,
                family_member: currentFamilyMember.id
            }
        ];
        
        const mockHours = [
            {
                description: "Consulting Work",
                hours: 8,
                rate: 50.00,
                family_member: currentFamilyMember.id
            },
            {
                description: "Project Development",
                hours: 12,
                rate: 45.00,
                family_member: currentFamilyMember.id
            }
        ];
        
        // Use API functions to create the data
        console.log('Creating mock expenses via API...');
        for (const expense of mockExpenses) {
            try {
                await window.djangoData.createExpense(expense);
                console.log('Created expense:', expense.description);
            } catch (error) {
                console.log('Mock expense creation failed (expected if already exists):', error.message);
            }
        }
        
        console.log('Creating mock miles via API...');
        for (const mile of mockMiles) {
            try {
                await window.djangoData.createMile(mile);
                console.log('Created mile:', mile.description);
            } catch (error) {
                console.log('Mock mile creation failed (expected if already exists):', error.message);
            }
        }
        
        console.log('Creating mock hours via API...');
        for (const hour of mockHours) {
            try {
                await window.djangoData.createHour(hour);
                console.log('Created hour:', hour.description);
            } catch (error) {
                console.log('Mock hour creation failed (expected if already exists):', error.message);
            }
        }
        
        // Reload the data from API
        await loadExpenses();
        await loadMiles();
        await loadHours();
        
        // Update statistics
        updateStatistics();
        
        console.log('Mock data created and loaded successfully');
        app.utils.showAlert('Mock data created via API and loaded!', 'success');
        
    } catch (error) {
        console.error('Error creating mock data:', error);
        app.utils.showAlert('Error creating mock data: ' + error.message, 'danger');
    }
}

function debugData() {
    console.log('=== DEBUG DATA ===');
    console.log('Current Family Member:', currentFamilyMember);
    console.log('All Expenses:', allExpenses);
    console.log('All Miles:', allMiles);
    console.log('All Hours:', allHours);
    console.log('Expense List Element:', document.getElementById('expenseList'));
    console.log('Miles List Element:', document.getElementById('milesList'));
    console.log('Hours List Element:', document.getElementById('hoursList'));
    
    // Check authentication
    const token = localStorage.getItem('token');
    console.log('Auth Token:', token ? 'Present' : 'Missing');
    console.log('Auth Status:', window.djangoAuth ? 'Available' : 'Not Available');
    
    // Check if elements exist
    const expenseList = document.getElementById('expenseList');
    if (expenseList) {
        console.log('Expense list HTML:', expenseList.innerHTML);
    } else {
        console.log('❌ Expense list element not found!');
    }
    
    // Check API configuration
    console.log('API Base URL:', CONFIG.API_BASE_URL);
    
    app.utils.showAlert(`Debug info logged to console. Expenses: ${allExpenses.length}, Miles: ${allMiles.length}, Hours: ${allHours.length}`, 'info');
}

// Clear mock data function
async function clearMockData() {
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }
    
    if (!confirm('Are you sure you want to clear all mock data? This will delete all expenses, miles, and hours for the current family member.')) {
        return;
    }
    
    try {
        console.log('Clearing mock data...');
        
        // Get all current data
        const expenses = await window.djangoData.getExpenses(currentFamilyMember.id);
        const miles = await window.djangoData.getMiles(currentFamilyMember.id);
        const hours = await window.djangoData.getHours(currentFamilyMember.id);
        
        // Delete expenses
        if (expenses && expenses.length > 0) {
            const expensesArray = Array.isArray(expenses) ? expenses : expenses.results || [];
            for (const expense of expensesArray) {
                try {
                    await window.djangoData.deleteExpense(expense.id);
                    console.log('Deleted expense:', expense.description);
                } catch (error) {
                    console.log('Error deleting expense:', error.message);
                }
            }
        }
        
        // Delete miles
        if (miles && miles.length > 0) {
            const milesArray = Array.isArray(miles) ? miles : miles.results || [];
            for (const mile of milesArray) {
                try {
                    await window.djangoData.deleteMile(mile.id);
                    console.log('Deleted mile:', mile.description);
                } catch (error) {
                    console.log('Error deleting mile:', error.message);
                }
            }
        }
        
        // Delete hours
        if (hours && hours.length > 0) {
            const hoursArray = Array.isArray(hours) ? hours : hours.results || [];
            for (const hour of hoursArray) {
                try {
                    await window.djangoData.deleteHour(hour.id);
                    console.log('Deleted hour:', hour.description);
                } catch (error) {
                    console.log('Error deleting hour:', error.message);
                }
            }
        }
        
        // Reload the data
        await loadExpenses();
        await loadMiles();
        await loadHours();
        
        // Update statistics
        updateStatistics();
        
        console.log('Mock data cleared successfully');
        app.utils.showAlert('All data cleared successfully!', 'success');
        
    } catch (error) {
        console.error('Error clearing mock data:', error);
        app.utils.showAlert('Error clearing data: ' + error.message, 'danger');
    }
}

// Refresh authentication
async function refreshAuth() {
    try {
        console.log('Refreshing authentication...');
        
        // Check if we have a token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Test the token by making a simple API call
        const response = await window.djangoData.getFamilyMembers();
        console.log('Authentication refresh successful');
        app.utils.showAlert('Authentication refreshed successfully!', 'success');
        
        // Reload data
        await loadExpenses();
        await loadMiles();
        await loadHours();
        
    } catch (error) {
        console.error('Authentication refresh failed:', error);
        app.utils.showAlert('Authentication failed. Please log in again.', 'danger');
        
        // Clear invalid token
        localStorage.removeItem('token');
        
        // Redirect to login or show login form
        if (window.djangoAuth && window.djangoAuth.logout) {
            window.djangoAuth.logout();
        }
    }
}

// Test API connectivity
async function testAPIConnectivity() {
    console.log('Testing API connectivity...');
    
    try {
        // Test basic API connection
        const response = await fetch(`${CONFIG.API_BASE_URL}/family-members/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ API connection successful');
            app.utils.showAlert('API connection is working!', 'success');
            return true;
        } else {
            console.log('❌ API connection failed:', response.status);
            app.utils.showAlert(`API connection failed: ${response.status}`, 'warning');
            return false;
        }
    } catch (error) {
        console.log('❌ API connection error:', error.message);
        app.utils.showAlert(`API connection error: ${error.message}`, 'danger');
        return false;
    }
}

// Email Functions
async function sendReport() {
    const recipientId = document.getElementById('reportRecipient').value;
    const reportType = document.getElementById('reportType').value;
    
    if (!recipientId) {
        app.utils.showAlert('Please select a family member', 'warning');
        return;
    }
    
    if (!currentFamilyMember) {
        app.utils.showAlert('Please select a family member first', 'warning');
        return;
    }
    
    try {
        // Get family member details
        const response = await window.djangoData.getFamilyMembers();
        const familyMembers = response.results || response;
        const recipient = familyMembers.find(m => m.id == recipientId);
        
        if (!recipient || !recipient.email) {
            app.utils.showAlert('Selected family member has no email address', 'warning');
            return;
        }
        
        // Show loading state
        const sendButton = document.querySelector('button[onclick="sendReport()"]');
        const originalText = sendButton.innerHTML;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
        sendButton.disabled = true;
        
        // Send email via backend API
        const emailResponse = await window.djangoData.sendFamilyReport(
            recipient.email,
            recipient.name,
            currentFamilyMember.id,
            reportType
        );
        
        app.utils.showAlert(`Report sent to ${recipient.email}!`, 'success');
        
        // Reset button
        sendButton.innerHTML = originalText;
        sendButton.disabled = false;
        
    } catch (error) {
        console.error('Error sending report:', error);
        app.utils.showAlert(`Error sending report: ${error.message}`, 'danger');
        
        // Reset button
        const sendButton = document.querySelector('button[onclick="sendReport()"]');
        sendButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Send Report';
        sendButton.disabled = false;
    }
}

async function generateReportData(reportType) {
    const data = {
        expenses: allExpenses,
        miles: allMiles,
        hours: allHours,
        familyMember: currentFamilyMember
    };
    
    switch(reportType) {
        case 'expenses':
            return { expenses: data.expenses };
        case 'miles':
            return { miles: data.miles };
        case 'hours':
            return { hours: data.hours };
        case 'monthly':
            return {
                summary: {
                    totalExpenses: data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
                    totalMiles: data.miles.reduce((sum, mile) => sum + parseFloat(mile.miles), 0),
                    totalHours: data.hours.reduce((sum, hour) => sum + parseFloat(hour.hours), 0)
                },
                recentActivity: [...data.expenses, ...data.miles, ...data.hours]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10)
            };
        case 'all':
        default:
            return data;
    }
}

function createEmailContent(recipient, reportData, reportType) {
    const subject = `Family Bookkeeping Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`;
    
    let content = `
        <h2>Family Bookkeeping Report</h2>
        <p>Dear ${recipient.name},</p>
        <p>Here is your ${reportType} report for ${currentFamilyMember.name}:</p>
    `;
    
    if (reportData.summary) {
        content += `
            <h3>Summary</h3>
            <ul>
                <li>Total Expenses: $${reportData.summary.totalExpenses.toFixed(2)}</li>
                <li>Total Miles: ${reportData.summary.totalMiles.toFixed(1)} miles</li>
                <li>Total Hours: ${reportData.summary.totalHours.toFixed(1)} hours</li>
            </ul>
        `;
    }
    
    if (reportData.expenses) {
        content += `
            <h3>Recent Expenses</h3>
            <ul>
                ${reportData.expenses.slice(0, 5).map(exp => 
                    `<li>${exp.description}: $${parseFloat(exp.amount).toFixed(2)}</li>`
                ).join('')}
            </ul>
        `;
    }
    
    content += `
        <p>Best regards,<br>Family Bookkeeping System</p>
    `;
    
    return { subject, content };
}

function showEmailPreview(recipient, emailContent) {
    const preview = `
        <div class="modal fade" id="emailPreviewModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Email Preview</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <strong>To:</strong> ${recipient.email}<br>
                            <strong>Subject:</strong> ${emailContent.subject}
                        </div>
                        <div class="border p-3" style="background: #f8f9fa;">
                            ${emailContent.content}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', preview);
    const modal = new bootstrap.Modal(document.getElementById('emailPreviewModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('emailPreviewModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('emailPreviewModal').remove();
    });
}

function saveEmailSettings() {
    const settings = {
        autoReports: document.getElementById('autoReports').checked,
        expenseNotifications: document.getElementById('expenseNotifications').checked,
        weeklySummary: document.getElementById('weeklySummary').checked
    };
    
    localStorage.setItem('emailSettings', JSON.stringify(settings));
    app.utils.showAlert('Email settings saved!', 'success');
}

async function testEmail() {
    const testEmail = document.getElementById('testEmailInput').value;
    
    if (!testEmail) {
        app.utils.showAlert('Please enter an email address', 'warning');
        return;
    }
    
    try {
        const response = await window.djangoData.testEmail(testEmail);
        app.utils.showAlert(`Test email sent to ${testEmail}!`, 'success');
        document.getElementById('testEmailInput').value = '';
    } catch (error) {
        console.error('Error sending test email:', error);
        app.utils.showAlert(`Error sending test email: ${error.message}`, 'danger');
    }
}

// Make functions globally available
window.exportToCSV = exportToCSV;
window.exportAllData = exportAllData;
window.generateReport = generateReport;
window.addFamilyMember = addFamilyMember;
window.editFamilyMember = editFamilyMember;
window.deleteFamilyMember = deleteFamilyMember;
window.sendReport = sendReport;
window.saveEmailSettings = saveEmailSettings;
window.testEmail = testEmail;

// Refresh family members function
async function refreshFamilyMembers() {
    try {
        console.log('Manually refreshing family members...');
        await loadFamilyMembersList();
        await loadFamilyMembers();
        app.utils.showAlert('Family members refreshed!', 'success');
    } catch (error) {
        console.error('Error refreshing family members:', error);
        app.utils.showAlert('Error refreshing family members', 'danger');
    }
}

window.refreshFamilyMembers = refreshFamilyMembers;

// Debug family members function
async function debugFamilyMembers() {
    try {
        console.log('=== DEBUG: Family Members ===');
        console.log('Current user:', currentUser);
        console.log('Current family member:', currentFamilyMember);
        
        // Test API call
        console.log('Testing API call...');
        const response = await window.djangoData.getFamilyMembers();
        console.log('API Response:', response);
        console.log('Data type:', typeof response);
        
        // Handle paginated response
        const data = response.results || response;
        console.log('Processed data:', data);
        console.log('Is array:', Array.isArray(data));
        console.log('Length:', data ? data.length : 'null/undefined');
        
        // Test DOM elements
        const select = document.getElementById('familyMemberSelect');
        const container = document.getElementById('familyMembersList');
        console.log('Select element:', select);
        console.log('Container element:', container);
        
        app.utils.showAlert(`Debug complete! Check console for details. Found ${data ? data.length : 0} family members.`, 'info');
        
    } catch (error) {
        console.error('Debug error:', error);
        app.utils.showAlert(`Debug error: ${error.message}`, 'danger');
    }
}

window.debugFamilyMembers = debugFamilyMembers;

// Multi-User Family System Functions
let currentUserRole = 'member';
let currentUserFamilyMember = null;

async function checkUserRole() {
    try {
        const userFamilyMember = await window.djangoData.getUserFamilyMember();
        currentUserFamilyMember = userFamilyMember;
        currentUserRole = userFamilyMember.role;
        
        console.log('User role:', currentUserRole);
        console.log('User family member:', userFamilyMember);
        
        // Show admin tab for all users (temporarily for testing)
        const adminTab = document.getElementById('adminTab');
        if (adminTab) {
            adminTab.style.display = 'block';
            console.log('Admin tab is now visible for all users');
        }
        
        return userFamilyMember;
    } catch (error) {
        console.error('Error checking user role:', error);
        return null;
    }
}

async function loadAllFamilyData() {
    try {
        console.log('Loading all family data...');
        const data = await window.djangoData.getAllFamilyData();
        console.log('All family data:', data);
        
        // Update combined statistics
        updateCombinedStatistics(data.combined_statistics);
        
        // Update individual family member data
        updateIndividualFamilyData(data.individual_data);
        
        // Update combined data tables
        updateCombinedDataTables(data);
        
    } catch (error) {
        console.error('Error loading all family data:', error);
        app.utils.showAlert('Error loading family data', 'danger');
    }
}

function updateCombinedStatistics(stats) {
    document.getElementById('combinedTotalExpenses').textContent = `$${stats.total_expenses.toFixed(2)}`;
    document.getElementById('combinedTotalMiles').textContent = `${stats.total_miles.toFixed(1)} miles`;
    document.getElementById('combinedTotalHours').textContent = `${stats.total_hours.toFixed(1)} hours`;
    document.getElementById('familyMemberCount').textContent = stats.family_member_count;
}

function updateIndividualFamilyData(individualData) {
    const container = document.getElementById('individualFamilyData');
    if (!container) return;
    
    if (individualData.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No family data found</div>';
        return;
    }
    
    container.innerHTML = individualData.map(member => `
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0">${member.family_member.name} (${member.family_member.relation})</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center">
                            <h5 class="text-primary">$${member.statistics.total_expenses.toFixed(2)}</h5>
                            <small class="text-muted">Expenses</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <h5 class="text-success">${member.statistics.total_miles.toFixed(1)}</h5>
                            <small class="text-muted">Miles</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <h5 class="text-warning">${member.statistics.total_hours.toFixed(1)}</h5>
                            <small class="text-muted">Hours</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCombinedDataTables(data) {
    // Update expenses table
    const expensesTable = document.getElementById('allExpensesTable');
    if (expensesTable) {
        if (data.all_expenses.length > 0) {
            expensesTable.innerHTML = data.all_expenses.map(expense => `
                <tr>
                    <td>${expense.family_member_name}</td>
                    <td>${expense.description}</td>
                    <td>$${parseFloat(expense.amount).toFixed(2)}</td>
                    <td>${new Date(expense.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } else {
            expensesTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No expenses found</td></tr>';
        }
    }
    
    // Update miles table
    const milesTable = document.getElementById('allMilesTable');
    if (milesTable) {
        if (data.all_miles.length > 0) {
            milesTable.innerHTML = data.all_miles.map(mile => `
                <tr>
                    <td>${mile.family_member_name}</td>
                    <td>${mile.description}</td>
                    <td>${parseFloat(mile.miles).toFixed(1)} miles</td>
                    <td>${new Date(mile.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } else {
            milesTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No miles found</td></tr>';
        }
    }
    
    // Update hours table
    const hoursTable = document.getElementById('allHoursTable');
    if (hoursTable) {
        if (data.all_hours.length > 0) {
            hoursTable.innerHTML = data.all_hours.map(hour => `
                <tr>
                    <td>${hour.family_member_name}</td>
                    <td>${hour.description}</td>
                    <td>${parseFloat(hour.hours).toFixed(1)} hours</td>
                    <td>${new Date(hour.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } else {
            hoursTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hours found</td></tr>';
        }
    }
}

// Make functions globally available
window.checkUserRole = checkUserRole;
window.loadAllFamilyData = loadAllFamilyData;

document.addEventListener('DOMContentLoaded', () => {
    // Set up form submissions
    const expenseForm = document.getElementById('expenseForm');
    const milesForm = document.getElementById('milesForm');
    const hoursForm = document.getElementById('hoursForm');
    
    // Set up search functionality
    const expenseSearch = document.getElementById('expenseSearch');
    const milesSearch = document.getElementById('milesSearch');
    const hoursSearch = document.getElementById('hoursSearch');
    
    if (expenseSearch) {
        expenseSearch.addEventListener('input', (e) => {
            filterExpenses(e.target.value);
        });
    }
    
    if (milesSearch) {
        milesSearch.addEventListener('input', (e) => {
            filterMiles(e.target.value);
        });
    }
    
    if (hoursSearch) {
        hoursSearch.addEventListener('input', (e) => {
            filterHours(e.target.value);
        });
    }
    
    // Set up tab change handlers
    const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabLinks.forEach(link => {
        link.addEventListener('shown.bs.tab', (e) => {
            const target = e.target.getAttribute('href');
            console.log('Tab changed to:', target);
            if (target === '#expenses') {
                loadExpenses();
            } else if (target === '#miles') {
                loadMiles();
            } else if (target === '#hours') {
                loadHours();
            } else if (target === '#reports') {
                loadReportsData();
            } else if (target === '#family') {
                loadFamilyMembersList();
            } else if (target === '#admin') {
                loadAllFamilyData();
            }
        });
    });
    
    // Set up family member form
    const familyMemberForm = document.getElementById('familyMemberForm');
    if (familyMemberForm) {
        familyMemberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addFamilyMember();
        });
    }
    const logoutBtn = document.getElementById('logoutBtn');

    if (expenseForm) expenseForm.addEventListener('submit', handleExpenseSubmit);
    if (milesForm) milesForm.addEventListener('submit', handleMilesSubmit);
    if (hoursForm) hoursForm.addEventListener('submit', handleHoursSubmit);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});

// Expense functions
async function loadExpenses() {
    if (!currentFamilyMember) {
        console.log('No current family member selected');
        return;
    }

    try {
        console.log('Loading expenses for family member:', currentFamilyMember.id);
        console.log('Current family member object:', currentFamilyMember);
        const data = await window.djangoData.getExpenses(currentFamilyMember.id);
        console.log('Expenses data received:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        
        // Handle paginated response
        let expensesData = [];
        if (Array.isArray(data)) {
            expensesData = data;
        } else if (data && data.results) {
            expensesData = data.results;
        } else {
            expensesData = [];
        }
        
        console.log('Processed expenses data:', expensesData);
        allExpenses = expensesData;
        console.log('All expenses set to:', allExpenses);
        console.log('All expenses length:', allExpenses.length);
        displayExpenses(allExpenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
        console.error('Error details:', error.message);
        
        // Add fallback mock data for testing if API fails
        console.log('API failed, using fallback mock data...');
        const mockExpenses = [
            {
                id: 'mock-1',
                description: "Gas Station",
                amount: "25.50",
                created_at: new Date().toISOString(),
                family_member: currentFamilyMember.id
            },
            {
                id: 'mock-2',
                description: "Office Supplies",
                amount: "15.75",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                family_member: currentFamilyMember.id
            },
            {
                id: 'mock-3',
                description: "Business Lunch",
                amount: "45.00",
                created_at: new Date(Date.now() - 172800000).toISOString(),
                family_member: currentFamilyMember.id
            }
        ];
        
        allExpenses = mockExpenses;
        console.log('Using fallback mock expenses:', allExpenses);
        displayExpenses(allExpenses);
        app.utils.showAlert('API connection failed. Showing fallback data for testing.', 'warning');
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
        allMiles = data || [];
        displayMiles(allMiles);
    } catch (error) {
        console.error('Error loading miles:', error);
        
        // Add mock data for testing
        console.log('Adding mock miles data for testing...');
        const mockMiles = [
            {
                id: 1,
                description: "Business Trip to Client",
                miles: "150",
                rate: "0.65",
                created_at: new Date().toISOString(),
                family_member: currentFamilyMember.id
            },
            {
                id: 2,
                description: "Office to Meeting",
                miles: "25",
                rate: "0.65",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                family_member: currentFamilyMember.id
            }
        ];
        
        allMiles = mockMiles;
        console.log('Using mock miles:', allMiles);
        displayMiles(allMiles);
        app.utils.showAlert('Using mock miles data for testing.', 'warning');
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
        allHours = data || [];
        displayHours(allHours);
    } catch (error) {
        console.error('Error loading hours:', error);
        
        // Add mock data for testing
        console.log('Adding mock hours data for testing...');
        const mockHours = [
            {
                id: 1,
                description: "Consulting Work",
                hours: "8",
                rate: "50.00",
                created_at: new Date().toISOString(),
                family_member: currentFamilyMember.id
            },
            {
                id: 2,
                description: "Project Development",
                hours: "12",
                rate: "45.00",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                family_member: currentFamilyMember.id
            }
        ];
        
        allHours = mockHours;
        console.log('Using mock hours:', allHours);
        displayHours(allHours);
        app.utils.showAlert('Using mock hours data for testing.', 'warning');
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
        console.log('Loading family members...');
        const response = await window.djangoData.getFamilyMembers();
        console.log('Family members response:', response);
        
        // Handle paginated response
        const data = response.results || response;
        console.log('Family members data (processed):', data);

        const select = document.getElementById('familyMemberSelect');
        if (select && Array.isArray(data)) {
            select.innerHTML = '<option value="">Select Family Member</option>' +
                data.map(member => `
                    <option value="${member.id}">${member.name} (${member.relation})</option>
                `).join('');

            console.log('Family members loaded in dropdown:', data.length);

            // Set the first family member as default if available
            if (data.length > 0) {
                // Find Muhammad Malik (Self) as the default
                currentFamilyMember = data.find(fm => fm.name === 'Muhammad Malik') || data[0];
                select.value = currentFamilyMember.id;
                console.log('Selected family member:', currentFamilyMember);
                console.log('Family member ID:', currentFamilyMember.id);
                console.log('Family member name:', currentFamilyMember.name);
                await Promise.all([
                    loadExpenses(),
                    loadMiles(),
                    loadHours(),
                    updateStatistics()
                ]);
            } else {
                console.log('No family members found');
            }

            select.addEventListener('change', (e) => {
                handleFamilyMemberChange(e.target.value, data);
            });
        } else {
            console.log('Select element not found or data is not an array');
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
async function addFamilyMember(name, relation) {
    try {
        const memberData = {
            name: name,
            relation: relation
        };

        const data = await window.djangoData.createFamilyMember(memberData);

        app.utils.showAlert('Family member added successfully!', 'success');
        await loadFamilyMembers();
        return data;
    } catch (error) {
        console.error('Error adding family member:', error);
        app.utils.showAlert(error.message, 'danger');
        return null;
    }
}

// Add this function to handle the Add Family Member modal
async function handleAddFamilyMember() {
    console.log('handleAddFamilyMember function called');
    
    // Get modal form elements
    const nameInput = document.getElementById('modalFamilyMemberName');
    const relationInput = document.getElementById('modalFamilyMemberRelation');
    const emailInput = document.getElementById('modalFamilyMemberEmail');
    const sendReportsCheckbox = document.getElementById('modalSendReports');
    const grantAccessCheckbox = document.getElementById('modalGrantAccess');
    const modal = bootstrap.Modal.getInstance(document.getElementById('addFamilyMemberModal'));

    console.log('Modal form elements found:', {
        nameInput: !!nameInput,
        relationInput: !!relationInput,
        emailInput: !!emailInput,
        sendReportsCheckbox: !!sendReportsCheckbox,
        grantAccessCheckbox: !!grantAccessCheckbox
    });

    // Validate elements exist
    if (!nameInput || !relationInput || !emailInput || !sendReportsCheckbox || !grantAccessCheckbox) {
        console.error('Modal form elements not found:', {
            nameInput: !!nameInput,
            relationInput: !!relationInput,
            emailInput: !!emailInput,
            sendReportsCheckbox: !!sendReportsCheckbox,
            grantAccessCheckbox: !!grantAccessCheckbox
        });
        app.utils.showAlert('Form elements not found. Please refresh the page.', 'danger');
        return;
    }

    // Get values
    const name = nameInput.value.trim();
    const relation = relationInput.value;
    const email = emailInput.value.trim();
    const sendReports = sendReportsCheckbox.checked;
    const grantAccess = grantAccessCheckbox.checked;

    console.log('Modal form values:', { name, relation, email, sendReports, grantAccess });
    console.log('Modal form element values:', {
        nameInput: nameInput.value,
        relationInput: relationInput.value,
        emailInput: emailInput.value,
        sendReportsCheckbox: sendReportsCheckbox.checked,
        grantAccessCheckbox: grantAccessCheckbox.checked
    });

    // Validate required fields
    if (!name) {
        app.utils.showAlert('Please enter a name', 'warning');
        nameInput.focus();
        return;
    }

    if (!relation) {
        app.utils.showAlert('Please select a relation', 'warning');
        relationInput.focus();
        return;
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
        app.utils.showAlert('Please enter a valid email address', 'warning');
        emailInput.focus();
        return;
    }

    try {
        const memberData = {
            name: name,
            relation: relation,
            email: email || null,
            is_registered: grantAccess,
            send_reports: sendReports,
            role: 'member', // Default role for new family members
            can_view_all: false // Default to false for new members
        };

        console.log('Sending modal family member data:', memberData);
        console.log('Modal data type check:', {
            name: typeof memberData.name,
            relation: typeof memberData.relation,
            email: typeof memberData.email,
            is_registered: typeof memberData.is_registered,
            send_reports: typeof memberData.send_reports,
            role: typeof memberData.role,
            can_view_all: typeof memberData.can_view_all
        });
        const response = await window.djangoData.createFamilyMember(memberData);
        console.log('Modal family member creation response:', response);
        app.utils.showAlert('Family member added successfully!', 'success');

        // Send welcome email if email is provided
        if (email && sendReports) {
            try {
                await window.djangoData.sendWelcomeEmail(email, name);
                app.utils.showAlert(`Welcome email sent to ${email}!`, 'success');
            } catch (error) {
                console.error('Error sending welcome email:', error);
                app.utils.showAlert('Family member added, but welcome email failed to send', 'warning');
            }
        }

        // Clear form and close modal
        document.getElementById('addFamilyMemberForm').reset();
        modal.hide();

        // Reload family members
        await loadFamilyMembersList();
        await loadFamilyMembers();

    } catch (error) {
        console.error('Error adding family member:', error);
        
        // Extract more specific error message
        let errorMessage = error.message;
        if (error.message.includes('HTTP 400')) {
            errorMessage = 'Invalid data provided. Please check all fields and try again.';
        } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('HTTP 401')) {
            errorMessage = 'Authentication required. Please login again.';
        }
        
        app.utils.showAlert(`Error adding family member: ${errorMessage}`, 'danger');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing app...');
        
        // Check user role and load appropriate data
        const userFamilyMember = await checkUserRole();
        console.log('User family member:', userFamilyMember);
        
        // Load initial data
        await loadFamilyMembers();
        
        // Load initial expenses, miles, and hours
        await loadExpenses();
        await loadMiles();
        await loadHours();
        
        // If user is admin, load all family data
        if (userFamilyMember && (userFamilyMember.role === 'admin' || userFamilyMember.can_view_all)) {
            console.log('Loading admin data...');
            loadAllFamilyData();
        }
        
        console.log('App initialization complete');
        
        // Force load expenses on the active tab
        setTimeout(() => {
            console.log('Force loading expenses after initialization...');
            loadExpenses();
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        app.utils.showAlert(`App initialization error: ${error.message}`, 'danger');
    }
});
