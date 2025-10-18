/**
 * API Key Manager Module
 * 
 * This module handles the validation and generation of API keys for client authentication.
 * It provides functions to validate API keys against the database and generate new keys.
 * 
 * @module apiKeyManager
 */
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config(); // Ensure environment variables are loaded before creating the pool
const { getSessionDir } = require('./utils/pathHelper');

// Log database connection parameters for debugging
console.log('Database connection parameters:');
console.log('DB_HOST:', process.env.DB_HOST || 'not set');
console.log('DB_USER:', process.env.DB_USER || 'not set');
console.log('DB_NAME:', process.env.DB_NAME || 'not set');

/**
 * Create a database connection pool
 * This ensures efficient handling of multiple database queries
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection on module load
(async () => {
    try {
        const [rows] = await pool.execute('SELECT 1 as connection_test');
        console.log('✅ Database connection successful:', rows[0].connection_test === 1);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Please check your database settings and .env file');
    }
})();

/**
 * Validate an API key against the database
 * 
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<boolean>} True if the API key is valid, false otherwise
 */
async function validateApiKey(apiKey) {
    // Updated column name from 'key' to 'api_key'
    const [rows] = await pool.execute('SELECT * FROM api_keys WHERE api_key = ?', [apiKey]);
    return rows.length > 0;
}

/**
 * Validate the admin API key
 * 
 * @param {string} adminKey - The admin API key to validate
 * @returns {Promise<boolean>} True if the admin key is valid, false otherwise
 */
async function validateAdminKey(adminKey) {
    return adminKey === process.env.ADMIN_API_KEY;
}

/**
 * Create a new client record in the database
 * 
 * @param {string} clientId - The unique client identifier
 * @returns {Promise<Object>} The created client record
 */
async function createClient(clientId) {
    // Use the cross-platform session directory resolver
    const sessionDir = getSessionDir(clientId);
   
    try {
        // Insert the essential client data
        const [result] = await pool.execute(
            'INSERT INTO clients (client_id, session_dir) VALUES (?, ?)',
            [clientId, sessionDir]
        );
        
        // Get the created client to return it
        const [clients] = await pool.execute(
            'SELECT * FROM clients WHERE id = ?',
            [result.insertId]
        );
        
        return clients[0];
    } catch (error) {
        console.error('Error creating client:', error);
        throw error;
    }
}

/**
 * Generate a new API key for a client
 * 
 * Creates a new client record if it doesn't exist and associates
 * a newly generated API key with it.
 * 
 * @param {string} clientId - The unique client identifier
 * @returns {Promise<string>} The newly generated API key
 */
async function generateApiKey(clientId) {
    // Generate a random API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Check if the client exists
    const [clients] = await pool.execute('SELECT id FROM clients WHERE client_id = ?', [clientId]);
    let clientDbId;
    
    if (clients.length === 0) {
        // Create the client if it doesn't exist
        clientDbId = await createClient(clientId);
    } else {
        clientDbId = clients[0].id;
    }
    
    // Store the API key in the database - updated column name from 'key' to 'api_key'
    await pool.execute(
        'INSERT INTO api_keys (api_key, client_id) VALUES (?, ?)',
        [apiKey, clientDbId]
    );
    
    return apiKey;
}

/**
 * Get client by client ID
 * 
 * Retrieves a client record from the database using its client ID
 * 
 * @param {string} clientId - The unique client identifier
 * @returns {Promise<Object|null>} The client record or null if not found
 */
async function getClientByClientId(clientId) {
    try {
        const [clients] = await pool.execute(
            'SELECT * FROM clients WHERE client_id = ?',
            [clientId]
        );
        
        return clients.length > 0 ? clients[0] : null;
    } catch (error) {
        console.error('Error getting client:', error);
        throw error;
    }
}

module.exports = {
    validateApiKey,
    validateAdminKey,
    generateApiKey,
    createClient,
    getClientByClientId  // Export the new function
};
