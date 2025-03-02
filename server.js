/**
 * WhatsApp Web.js API Server
 * 
 * This server provides a REST API for interacting with WhatsApp using the whatsapp-web.js library.
 * It supports multiple client instances for commercial applications, with API key authentication.
 * 
 * @author Your Name
 * @version 1.0.0
 */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeClient, clients } = require('./whatsappClient');
const { validateApiKey, validateAdminKey, generateApiKey } = require('./apiKeyManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(express.static('public'));

/**
 * API Key Validation Middleware
 * 
 * Validates the API key provided in request headers for all endpoints
 * except the admin endpoints which use a different authentication method.
 */
const apiKeyMiddleware = async (req, res, next) => {
    // Skip API key validation for the admin endpoint
    if (req.path === '/api/admin/create-api-key') {
        return next();
    }
    
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || !(await validateApiKey(apiKey))) {
        return res.status(403).json({ status: 'error', message: 'Invalid API key' });
    }
    next();
};

app.use(apiKeyMiddleware);

/**
 * Admin endpoint for creating new API keys
 * 
 * This endpoint is protected by the admin API key and allows the creation
 * of new client-specific API keys that can be used to access other endpoints.
 * 
 * @route POST /api/admin/create-api-key
 * @param {string} adminKey - The admin API key (in x-admin-key header)
 * @param {string} clientId - The client identifier (in request body)
 * @returns {Object} Response containing the generated API key
 */
app.post('/api/admin/create-api-key', async (req, res) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        const { clientId } = req.body;
        
        // Validate admin key
        if (!adminKey || !(await validateAdminKey(adminKey))) {
            return res.status(403).json({ status: 'error', message: 'Invalid admin key' });
        }
        
        // Validate request
        if (!clientId) {
            return res.status(400).json({ status: 'error', message: 'Client ID is required' });
        }
        
        // Generate API key
        const apiKey = await generateApiKey(clientId);
        
        return res.json({
            status: 'success',
            message: 'API key created successfully',
            data: {
                clientId,
                apiKey
            }
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create API key',
            error: error.message
        });
    }
});

/**
 * Initialize WhatsApp client instance
 * 
 * Creates and initializes a new WhatsApp client instance for the specified client ID.
 * 
 * @route POST /api/init
 * @param {string} clientId - The client identifier (in request body)
 * @returns {Object} Response indicating successful initialization
 */
app.post('/api/init', (req, res) => {
    const { clientId } = req.body;
    if (!clientId) {
        return res.status(400).json({ status: 'error', message: 'Client ID is required' });
    }

    const sessionDir = path.resolve(process.env.SESSION_DIR || `/app/.wwebjs_auth/${clientId}`);
    const client = initializeClient(clientId, sessionDir);

    res.json({ status: 'success', message: 'Client initialized', clientId });
});

/**
 * Get client status
 * 
 * Retrieves the current authentication and readiness status of a WhatsApp client.
 * 
 * @route GET /api/status/:clientId
 * @param {string} clientId - The client identifier (in URL parameter)
 * @returns {Object} Response containing the client's status information
 */
app.get('/api/status/:clientId', (req, res) => {
    const { clientId } = req.params;
    const client = clients[clientId];

    if (!client) {
        return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    res.json({
        authenticated: client.isAuthenticated,
        ready: client.isClientReady,
        error: client.authError
    });
});

/**
 * Get QR code for WhatsApp authentication
 * 
 * Retrieves the QR code that needs to be scanned to authenticate with WhatsApp.
 * Returns different responses based on the client's current authentication status.
 * 
 * @route GET /api/qr/:clientId
 * @param {string} clientId - The client identifier (in URL parameter)
 * @returns {Object} Response containing QR code data or status information
 */
app.get('/api/qr/:clientId', (req, res) => {
    const { clientId } = req.params;
    const client = clients[clientId];

    if (!client) {
        return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    if (client.isAuthenticated) {
        return res.json({
            status: 'authenticated',
            message: 'Client is already authenticated. No need for QR code.'
        });
    }

    if (client.isClientReady) {
        return res.json({
            status: 'ready',
            message: 'Client is ready and authenticated. No need for QR code.'
        });
    }

    if (client.authError) {
        return res.json({
            status: 'error',
            message: 'Authentication error occurred',
            error: client.authError
        });
    }

    if (client.qrCodeData) {
        return res.json({
            status: 'success',
            qr: client.qrCodeData
        });
    } else {
        return res.json({
            status: 'waiting',
            message: 'QR code not yet available. Please try again in a few seconds.'
        });
    }
});

/**
 * Send WhatsApp message
 * 
 * Sends a message to a specified phone number using the client's WhatsApp instance.
 * 
 * @route POST /api/sendmessage/:clientId
 * @param {string} clientId - The client identifier (in URL parameter)
 * @param {string} number - The recipient's phone number (in request body)
 * @param {string} message - The message content (in request body)
 * @returns {Object} Response indicating success or failure
 */
app.post('/api/sendmessage/:clientId', async (req, res) => {
    const { clientId } = req.params;
    const { number, message } = req.body;
    const client = clients[clientId];

    if (!client) {
        return res.status(404).json({ status: 'error', message: 'Client not found' });
    }

    if (!number || !message) {
        return res.status(400).json({
            status: 'error',
            message: 'Number and message are required'
        });
    }

    if (!client.isAuthenticated) {
        return res.status(403).json({
            status: 'error',
            message: 'WhatsApp client is not authenticated'
        });
    }

    if (!client.isClientReady) {
        return res.status(503).json({
            status: 'error',
            message: 'WhatsApp client is authenticated but not ready yet'
        });
    }

    try {
        // Format number to proper WhatsApp format if needed
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        const result = await client.client.sendMessage(formattedNumber, message);

        res.json({
            status: 'success',
            message: 'Message sent successfully',
            data: {
                id: result.id._serialized
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Start the server on the specified port
app.listen(PORT, () => {
    console.log(`WhatsApp Web.js API Server is running on port ${PORT}`);
});
