/**
 * WhatsApp Client Manager Module
 * 
 * This module handles the creation, initialization, and management of WhatsApp client instances.
 * It provides functions to create new clients and tracks their status.
 * 
 * @module whatsappClient
 */
const { Client, LocalAuth } = require('./index');
const qrcode = require('qrcode');
const path = require('path');

/**
 * Object to store all active client instances and their status
 */
const clients = {};

/**
 * Initialize a new WhatsApp client instance
 * 
 * Creates and initializes a new WhatsApp client for the specified client ID.
 * Sets up event handlers for tracking the client's status.
 * 
 * @param {string} clientId - The unique client identifier
 * @param {string} sessionDir - Directory to store session data
 * @returns {Object} The client instance and its status information
 */
function initializeClient(clientId, sessionDir) {
    console.log(`Initializing WhatsApp client ${clientId} with session directory: ${sessionDir}`);
    
    // Determine browser options based on platform
    const isWindows = process.platform === 'win32';
    const puppeteerOpts = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=site-per-process',
            '--allow-file-access-from-files'
        ],
        ignoreDefaultArgs: ['--disable-extensions']
    };
    
    // Only set executablePath if it's explicitly defined in environment
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        console.log(`Using browser at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
        puppeteerOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
        console.log('No browser path specified, using system default browser');
    }
    
    // If on Windows, don't use the Linux-specific user-data-dir
    if (!isWindows) {
        puppeteerOpts.args.push('--user-data-dir=/tmp/puppeteer_user_data');
    }
    
    // Configure and create the WhatsApp client
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: sessionDir
        }),
        puppeteer: puppeteerOpts
    });

    // Store client and its status information
    clients[clientId] = {
        client,
        qrCodeData: null,
        isAuthenticated: false,
        isClientReady: false,
        authError: null
    };

    // Initialize the client with better error handling
    try {
        client.initialize().catch(err => {
            console.error(`Error initializing client ${clientId}:`, err);
            clients[clientId].authError = err.message;
        });
    } catch (err) {
        console.error(`Exception during client ${clientId} initialization:`, err);
        clients[clientId].authError = err.message;
    }

    // Set up event handlers

    /**
     * QR code event handler
     * Generates a data URL for the QR code when it's received
     */
    client.on('qr', async (qr) => {
        console.log(`QR RECEIVED for client ${clientId}`, qr);
        clients[clientId].isAuthenticated = false;
        clients[clientId].isClientReady = false;
        
        try {
            clients[clientId].qrCodeData = await qrcode.toDataURL(qr);
            console.log(`QR code generated as base64 for client ${clientId}`);
        } catch (err) {
            console.error(`Error generating QR code for client ${clientId}`, err);
        }
    });

    /**
     * Ready event handler
     * Triggered when the client is fully initialized and ready to use
     */
    client.on('ready', () => {
        console.log(`Client ${clientId} is ready!`);
        clients[clientId].isClientReady = true;
        clients[clientId].qrCodeData = null;
    });

    /**
     * Authenticated event handler
     * Triggered when the client has successfully authenticated with WhatsApp
     */
    client.on('authenticated', () => {
        console.log(`Client ${clientId} AUTHENTICATED`);
        clients[clientId].isAuthenticated = true;
        clients[clientId].authError = null;
        clients[clientId].qrCodeData = null;
    });

    /**
     * Authentication failure event handler
     * Triggered when the client fails to authenticate with WhatsApp
     */
    client.on('auth_failure', msg => {
        console.error(`Client ${clientId} AUTHENTICATION FAILURE`, msg);
        clients[clientId].isAuthenticated = false;
        clients[clientId].isClientReady = false;
        clients[clientId].authError = msg;
    });

    /**
     * Disconnected event handler
     * Triggered when the client is disconnected from WhatsApp
     */
    client.on('disconnected', (reason) => {
        console.log(`Client ${clientId} was logged out`, reason);
        clients[clientId].isAuthenticated = false;
        clients[clientId].isClientReady = false;
        clients[clientId].qrCodeData = null;
    });

    return clients[clientId];
}

module.exports = {
    initializeClient,
    clients
};
