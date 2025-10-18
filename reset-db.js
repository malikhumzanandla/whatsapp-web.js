/**
 * Database Reset Script
 * 
 * This script drops all tables and then runs the migrations to recreate them.
 * WARNING: This will delete all data in the database!
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function resetDatabase() {
    console.log('Starting database reset...');
    console.log('WARNING: This will delete all existing data!');
    
    let connection;
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // Drop tables in reverse order of dependencies
        console.log('Dropping existing tables...');
        await connection.query('DROP TABLE IF EXISTS whatsapp_sessions');
        await connection.query('DROP TABLE IF EXISTS api_keys');
        await connection.query('DROP TABLE IF EXISTS clients');
        await connection.query('DROP TABLE IF EXISTS migrations');
        
        console.log('Tables dropped successfully.');
        console.log('To recreate the tables, run: node migrate.js');
    } catch (error) {
        console.error('Error resetting database:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Check if this is being run directly
if (require.main === module) {
    // Ask for confirmation before proceeding
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('This will DELETE ALL DATA in your database. Are you sure? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
            await resetDatabase();
        } else {
            console.log('Database reset cancelled.');
        }
        readline.close();
    });
} else {
    // Export the function for use in other scripts
    module.exports = resetDatabase;
}
