exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    // CORS headers for all responses
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    const path = event.path || '/';
    const method = event.httpMethod || 'GET';

    try {
        // Health endpoint
        if (path === '/health' || path === '/api/health') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Backend is working!',
                    timestamp: new Date().toISOString(),
                    path: path,
                    method: method
                })
            };
        }

        // Login endpoint
        if (path === '/login' && method === 'POST') {
            // Parse form data or JSON
            let body = {};
            if (event.body) {
                if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
                    // Parse URL encoded form data manually
                    const params = event.body.split('&');
                    for (const param of params) {
                        const [key, value] = param.split('=');
                        if (key && value) {
                            body[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
                        }
                    }
                } else {
                    // Parse JSON
                    body = JSON.parse(event.body);
                }
            }

            console.log('Login attempt:', { email: body.email });

            // Simple demo authentication (replace with real auth in production)
            if (body.email && body.password) {
                if (body.email === 'admin@test.com' && body.password === 'password') {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            user: {
                                email: body.email,
                                name: 'Demo User',
                                id: 1
                            },
                            message: 'Login successful'
                        })
                    };
                } else {
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: 'Invalid credentials'
                        })
                    };
                }
            } else {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Email and password required'
                    })
                };
            }
        }

        // Dashboard/protected endpoints
        if (path === '/dashboard' || path === '/api/categories' || path === '/api/items') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Protected endpoint - authentication required',
                    path: path,
                    timestamp: new Date().toISOString()
                })
            };
        }

        // Default response for unknown paths
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Backend API is working!',
                timestamp: new Date().toISOString(),
                path: path,
                method: method,
                availableEndpoints: [
                    'GET /health',
                    'GET /api/health', 
                    'POST /login',
                    'GET /dashboard',
                    'GET /api/categories',
                    'GET /api/items'
                ]
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};