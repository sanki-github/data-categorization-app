const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        message: 'Azure Container Apps backend is working successfully!',
        timestamp: new Date().toISOString(),
        platform: 'Azure Container Apps',
        version: '1.0.2',
        status: 'healthy'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        message: 'Azure Container Apps backend is working successfully!',
        timestamp: new Date().toISOString(),
        platform: 'Azure Container Apps',
        version: '1.0.1'
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple validation for demo
    if (email && password) {
        res.json({
            success: true,
            user: {
                email: email,
                name: email.split('@')[0]
            },
            message: 'Login successful'
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple validation for demo
    if (email && password) {
        res.json({
            success: true,
            user: {
                email: email,
                name: email.split('@')[0]
            },
            message: 'Login successful'
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});