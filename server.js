const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Add this after your middleware setup
app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) throw error;
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// Error handling middleware
const handleError = (res, error, context) => {
    console.error(`Error in ${context}:`, error);
    res.status(500).json({ 
        error: error.message || 'Internal server error',
        context 
    });
};

// API endpoints for family members
app.get('/api/family-members', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        handleError(res, error, 'fetching family members');
    }
});

// Expenses endpoints
app.get('/api/expenses', async (req, res) => {
    const { family_member_id } = req.query;
    try {
        if (!family_member_id) {
            return res.status(400).json({ error: 'Family member ID is required' });
        }

        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('family_member_id', family_member_id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        handleError(res, error, 'fetching expenses');
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const { description, amount, family_member_id } = req.body;

        if (!description || !amount || !family_member_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('expenses')
            .insert([{ 
                description, 
                amount: parseFloat(amount),
                family_member_id,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Miles routes
app.get('/api/miles', async (req, res) => {
    const { family_member_id } = req.query;
    try {
        if (!family_member_id) {
            return res.status(400).json({ error: 'Family member ID is required' });
        }

        const { data, error } = await supabase
            .from('miles')
            .select('*')
            .eq('family_member_id', family_member_id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        handleError(res, error, 'fetching miles');
    }
});

app.post('/api/miles', async (req, res) => {
    try {
        const { description, miles, family_member_id } = req.body;
        console.log('Received miles data:', { description, miles, family_member_id });
        
        if (!description || !miles || !family_member_id) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { description, miles, family_member_id }
            });
        }

        const { data, error } = await supabase
            .from('miles')
            .insert([{ 
                description, 
                miles: parseFloat(miles),
                family_member_id,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        console.log('Successfully added miles:', data[0]);
        res.status(201).json(data[0]);
    } catch (error) {
        handleError(res, error, 'adding miles');
    }
});

// Hours routes
app.get('/api/hours', async (req, res) => {
    const { family_member_id } = req.query;
    try {
        if (!family_member_id) {
            return res.status(400).json({ error: 'Family member ID is required' });
        }

        const { data, error } = await supabase
            .from('hours')
            .select('*')
            .eq('family_member_id', family_member_id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        handleError(res, error, 'fetching hours');
    }
});

app.post('/api/hours', async (req, res) => {
    try {
        const { description, hours, family_member_id } = req.body;
        console.log('Received hours data:', { description, hours, family_member_id });
        
        if (!description || !hours || !family_member_id) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: { description, hours, family_member_id }
            });
        }

        const { data, error } = await supabase
            .from('hours')
            .insert([{ 
                description, 
                hours: parseFloat(hours),
                family_member_id,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        console.log('Successfully added hours:', data[0]);
        res.status(201).json(data[0]);
    } catch (error) {
        handleError(res, error, 'adding hours');
    }
});

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 