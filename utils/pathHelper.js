/**
 * Path Helper Utilities
 * 
 * This module provides cross-platform path utilities for the application.
 * It ensures paths work correctly on both Windows and Linux platforms.
 * 
 * @module pathHelper
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Get the appropriate session directory path based on platform
 * 
 * @param {string} clientId - The client identifier
 * @returns {string} The resolved session directory path
 */
function getSessionDir(clientId) {
    // Get base directory from environment or use defaults based on platform
    const baseDir = process.env.SESSION_BASE_DIR || '';
    const dirName = process.env.SESSION_DIR_NAME || '.wwebjs_auth';
    
    let sessionPath;
    
    if (process.platform === 'win32') {
        // Windows path handling
        if (baseDir.includes(':')) {
            // If baseDir is already a full path (has drive letter)
            sessionPath = path.join(baseDir, dirName, clientId);
        } else if (baseDir === '') {
            // Default to app directory for Windows
            sessionPath = path.join(process.cwd(), dirName, clientId);
        } else {
            // Use the provided relative path
            sessionPath = path.join(process.cwd(), baseDir, dirName, clientId);
        }
    } else {
        // Linux/Unix path handling
        if (baseDir.startsWith('/')) {
            // If baseDir is an absolute path
            sessionPath = path.join(baseDir, dirName, clientId);
        } else if (baseDir === '') {
            // Default to home directory for Linux/Unix
            sessionPath = path.join(os.homedir(), dirName, clientId);
        } else {
            // Use the provided relative path
            sessionPath = path.join(process.cwd(), baseDir, dirName, clientId);
        }
    }
    
    // Ensure the directory exists
    ensureDirectoryExists(sessionPath);
    
    console.log(`Resolved session directory for ${clientId}: ${sessionPath}`);
    return sessionPath;
}

/**
 * Ensure a directory exists, creating it if necessary
 * 
 * @param {string} dirPath - The directory path to ensure
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Created directory: ${dirPath}`);
        } catch (err) {
            console.error(`Error creating directory ${dirPath}:`, err);
        }
    }
}

module.exports = {
    getSessionDir
};
