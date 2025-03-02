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
    // Configure and create the WhatsApp client
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: sessionDir
        }),
        puppeteer: { 
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
                '--allow-file-access-from-files',
                '--user-data-dir=/tmp/puppeteer_user_data'
            ],
            ignoreDefaultArgs: ['--disable-extensions'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        }
    });

    // Store client and its status information
    clients[clientId] = {
        client,
        qrCodeData: null,
        isAuthenticated: false,
        isClientReady: false,
        authError: null
    };

    // Initialize the client
    client.initialize();

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
