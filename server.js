const express = require('express');
const { Client, LocalAuth } = require('./index');
const qrcode = require('qrcode');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Client state tracking
let qrCodeData = null;
let isAuthenticated = false;
let isClientReady = false;
let authError = null;

// Session directory path
const sessionDir = path.resolve(process.env.SESSION_DIR || '/app/.wwebjs_auth');

// Initialize WhatsApp client with Docker-specific configuration
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: sessionDir
    }),
    puppeteer: { 
        headless: true, // Switch to true for server environment
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=site-per-process',
            '--allow-file-access-from-files',
            '--user-data-dir=/tmp/puppeteer_user_data'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    }
});

// Initialize client
client.initialize();

// Client event handlers
client.on('qr', async (qr) => {
    console.log('QR RECEIVED', qr);
    isAuthenticated = false;
    isClientReady = false;
    
    // Convert QR code to data URL (base64)
    try {
        qrCodeData = await qrcode.toDataURL(qr);
        console.log('QR code generated as base64');
    } catch (err) {
        console.error('Error generating QR code', err);
    }
});

client.on('ready', () => {
    console.log('Client is ready!');
    isClientReady = true;
    qrCodeData = null; // Clear QR code as it's no longer needed
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
    isAuthenticated = true;
    authError = null;
    qrCodeData = null; // Clear QR code as it's no longer needed
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    isAuthenticated = false;
    isClientReady = false;
    authError = msg;
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    isAuthenticated = false;
    isClientReady = false;
    qrCodeData = null;
});

// API Endpoints

// Get client status
app.get('/api/status', (req, res) => {
    res.json({
        authenticated: isAuthenticated,
        ready: isClientReady,
        error: authError
    });
});

// Get QR code
app.get('/api/qr', (req, res) => {
    if (isAuthenticated) {
        return res.json({
            status: 'authenticated',
            message: 'Client is already authenticated. No need for QR code.'
        });
    }
    
    if (isClientReady) {
        return res.json({
            status: 'ready',
            message: 'Client is ready and authenticated. No need for QR code.'
        });
    }

    if (authError) {
        return res.json({
            status: 'error',
            message: 'Authentication error occurred',
            error: authError
        });
    }
    
    if (qrCodeData) {
        return res.json({
            status: 'success',
            qr: qrCodeData
        });
    } else {
        return res.json({
            status: 'waiting',
            message: 'QR code not yet available. Please try again in a few seconds.'
        });
    }
});

// Send message endpoint
app.post('/api/sendmessage', async (req, res) => {
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({
            status: 'error',
            message: 'Number and message are required'
        });
    }

    // Check client state
    if (!isAuthenticated) {
        return res.status(403).json({
            status: 'error',
            message: 'WhatsApp client is not authenticated'
        });
    }

    if (!isClientReady) {
        return res.status(503).json({
            status: 'error',
            message: 'WhatsApp client is authenticated but not ready yet'
        });
    }

    try {
        // Format number to proper WhatsApp format if needed
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        
        // Send message
        const result = await client.sendMessage(formattedNumber, message);
        
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
