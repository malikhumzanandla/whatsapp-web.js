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

/**
 * Create a database connection pool
 * This ensures efficient handling of multiple database queries
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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
 * @returns {Promise<number>} The database ID of the newly created client
 */
async function createClient(clientId) {
    const sessionDir = `/app/.wwebjs_auth/${clientId}`;
    
    const [result] = await pool.execute(
        'INSERT INTO clients (client_id, session_dir) VALUES (?, ?)',
        [clientId, sessionDir]
    );
    
    return result.insertId;
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

module.exports = {
    validateApiKey,
    validateAdminKey,
    generateApiKey
};
