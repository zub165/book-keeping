document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadExpenses();
    loadMiles();
    loadHours();

    // Set up form submissions
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
    document.getElementById('milesForm').addEventListener('submit', handleMilesSubmit);
    document.getElementById('hoursForm').addEventListener('submit', handleHoursSubmit);
});

// Expense functions
async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        const expenseList = document.getElementById('expenseList');
        expenseList.innerHTML = expenses.map(expense => `
            <li class="list-group-item">
                ${expense.description}: $${expense.amount.toFixed(2)}
                <small class="text-muted">${new Date(expense.created_at).toLocaleDateString()}</small>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function handleExpenseSubmit(event) {
    event.preventDefault();
    const description = document.getElementById('expenseDesc').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, amount })
        });

        if (response.ok) {
            document.getElementById('expenseForm').reset();
            loadExpenses();
        }
    } catch (error) {
        console.error('Error adding expense:', error);
    }
}

// Miles functions
async function loadMiles() {
    try {
        const response = await fetch('/api/miles');
        const miles = await response.json();
        const milesList = document.getElementById('milesList');
        milesList.innerHTML = miles.map(mile => `
            <li class="list-group-item">
                ${mile.description}: ${mile.miles} miles
                <small class="text-muted">${new Date(mile.created_at).toLocaleDateString()}</small>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading miles:', error);
    }
}

async function handleMilesSubmit(event) {
    event.preventDefault();
    const description = document.getElementById('milesDesc').value;
    const miles = parseFloat(document.getElementById('milesAmount').value);

    try {
        const response = await fetch('/api/miles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, miles })
        });

        if (response.ok) {
            document.getElementById('milesForm').reset();
            loadMiles();
        }
    } catch (error) {
        console.error('Error adding miles:', error);
    }
}

// Hours functions
async function loadHours() {
    try {
        const response = await fetch('/api/hours');
        const hours = await response.json();
        const hoursList = document.getElementById('hoursList');
        hoursList.innerHTML = hours.map(hour => `
            <li class="list-group-item">
                ${hour.description}: ${hour.hours} hours
                <small class="text-muted">${new Date(hour.created_at).toLocaleDateString()}</small>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading hours:', error);
    }
}

async function handleHoursSubmit(event) {
    event.preventDefault();
    const description = document.getElementById('hoursDesc').value;
    const hours = parseFloat(document.getElementById('hoursAmount').value);

    try {
        const response = await fetch('/api/hours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, hours })
        });

        if (response.ok) {
            document.getElementById('hoursForm').reset();
            loadHours();
        }
    } catch (error) {
        console.error('Error adding hours:', error);
    }
} 