const { app } = require('@azure/functions');

app.http('api', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: '{*restOfPath}',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        };

        // Handle preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: corsHeaders,
                body: ''
            };
        }

        const url = new URL(request.url);
        const path = url.pathname.replace('/api', '') || '/';
        const method = request.method;

        try {
            // Health endpoint
            if (path === '/health' || path === '/api/health') {
                return {
                    status: 200,
                    headers: corsHeaders,
                    jsonBody: {
                        message: 'Azure Backend is working!',
                        timestamp: new Date().toISOString(),
                        path: path,
                        method: method,
                        platform: 'Azure Functions'
                    }
                };
            }

            // Login endpoint
            if (path === '/login' && method === 'POST') {
                const body = await request.json();
                context.log('Login attempt:', { email: body.email });

                // Simple demo authentication
                if (body.email && body.password) {
                    if (body.email === 'admin@test.com' && body.password === 'password') {
                        return {
                            status: 200,
                            headers: corsHeaders,
                            jsonBody: {
                                success: true,
                                user: {
                                    email: body.email,
                                    name: 'Azure Demo User',
                                    id: 1
                                },
                                message: 'Login successful on Azure'
                            }
                        };
                    } else {
                        return {
                            status: 401,
                            headers: corsHeaders,
                            jsonBody: {
                                success: false,
                                message: 'Invalid credentials'
                            }
                        };
                    }
                } else {
                    return {
                        status: 400,
                        headers: corsHeaders,
                        jsonBody: {
                            success: false,
                            message: 'Email and password required'
                        }
                    };
                }
            }

            // Dashboard/protected endpoints
            if (path === '/dashboard' || path === '/categories' || path === '/items') {
                return {
                    status: 200,
                    headers: corsHeaders,
                    jsonBody: {
                        message: 'Protected endpoint - authentication required',
                        path: path,
                        timestamp: new Date().toISOString(),
                        platform: 'Azure Functions'
                    }
                };
            }

            // Default response
            return {
                status: 200,
                headers: corsHeaders,
                jsonBody: {
                    message: 'Azure Functions Backend API is working!',
                    timestamp: new Date().toISOString(),
                    path: path,
                    method: method,
                    platform: 'Azure Functions',
                    availableEndpoints: [
                        'GET /health',
                        'POST /login',
                        'GET /dashboard',
                        'GET /categories',
                        'GET /items'
                    ]
                }
            };

        } catch (error) {
            context.log.error('Error:', error);
            return {
                status: 500,
                headers: corsHeaders,
                jsonBody: {
                    message: 'Internal server error',
                    error: error.message,
                    platform: 'Azure Functions'
                }
            };
        }
    }
});