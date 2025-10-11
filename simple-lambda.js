exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
        },
        body: JSON.stringify({
            message: 'Backend is working!',
            timestamp: new Date().toISOString(),
            path: event.path || 'unknown',
            method: event.httpMethod || 'unknown'
        })
    };
};