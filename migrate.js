/**
 * Database Migration Script
 * 
 * This script runs SQL migration files in the migrations directory.
 * It tracks which migrations have already been applied to prevent running them multiple times.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

/**
 * Main migration function
 */
async function migrate() {
    console.log('Starting database migration...');
    
    let connection;
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true // Allow multiple SQL statements in one query
        });
        
        // Check if database exists, create if it doesn't
        console.log(`Checking if database ${process.env.DB_NAME} exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`Using database ${process.env.DB_NAME}...`);
        await connection.query(`USE ${process.env.DB_NAME}`);
        
        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
        
        console.log(`Found ${sqlFiles.length} migration files`);

        // Make sure migration table exists first (special case for the migrations table itself)
        const migrationTableFile = sqlFiles.find(file => file.includes('create_migrations_table'));
        
        if (migrationTableFile) {
            console.log(`Ensuring migrations table exists (${migrationTableFile})...`);
            const filePath = path.join(migrationsDir, migrationTableFile);
            const sql = await fs.readFile(filePath, 'utf8');
            
            try {
                await connection.query(sql);
                console.log('Migrations table is ready.');
            } catch (error) {
                console.error(`Error creating migrations table: ${error.message}`);
                throw error;
            }
            
            // Remove from the list of migrations to process
            const index = sqlFiles.indexOf(migrationTableFile);
            if (index > -1) {
                sqlFiles.splice(index, 1);
            }
        }
        
        // Get already applied migrations
        const [appliedMigrations] = await connection.query('SELECT migration_name FROM migrations');
        const appliedMigrationsSet = new Set(appliedMigrations.map(row => row.migration_name));
        
        // Execute each migration file that hasn't been applied yet
        for (const file of sqlFiles) {
            if (appliedMigrationsSet.has(file)) {
                console.log(`Skipping already applied migration: ${file}`);
                continue;
            }
            
            console.log(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');
            
            try {
                await connection.query(sql);
                
                // Record that this migration has been applied
                await connection.query(
                    'INSERT INTO migrations (migration_name) VALUES (?)',
                    [file]
                );
                
                console.log(`Successfully executed ${file}`);
            } catch (error) {
                console.error(`Error executing ${file}: ${error.message}`);
                throw error;
            }
        }
        
        console.log('All migrations completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
migrate();
