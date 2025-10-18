# Database Migration Guide

This guide explains how to run the database migrations for the WhatsApp Web.js API Server.

## How Migrations Work

The migration system keeps track of which migrations have been applied to your database using a `migrations` table. This prevents migrations from running multiple times and allows you to easily update your database schema.

Each migration file in the `migrations/` directory contains SQL statements that modify the database schema. The files are executed in alphabetical order, which is why they are typically prefixed with numbers (e.g., `000_`, `001_`).

## Running Migrations

### Method 1: Using the Node.js Migration Script (Recommended)

For a robust approach that tracks which migrations have been run, use the migration script:

1. First, make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Run the migration script:
   ```bash
   node migrate.js
   ```

The script will:
- Connect to the database using the credentials in your `.env` file
- Create the database if it doesn't exist
- Create a migrations tracking table if it doesn't exist
- Execute only the migrations that haven't been run yet
- Record each successful migration in the tracking table

### Method 2: Using MySQL Command Line (Manual)

You can also run migrations manually using the MySQL command-line client:

```bash
# Replace with your MySQL username and database name
mysql -u root -p whatsapp_web < /d:/projects/whatsapp-web.js/migrations/000_create_migrations_table.sql
mysql -u root -p whatsapp_web < /d:/projects/whatsapp-web.js/migrations/001_create_tables.sql
# ... and so on for additional migration files
```

However, when using this approach, you'll need to manually record each migration in the migrations table:

```sql
INSERT INTO migrations (migration_name) VALUES ('001_create_tables.sql');
```

## Creating New Migrations

When you need to make changes to the database schema:

1. Create a new SQL file in the `migrations/` directory
2. Name it with the next number in sequence and a descriptive name, e.g., `002_add_user_settings.sql`
3. Add your SQL statements to the file
4. Run the migration script to apply the changes

## Verifying Migrations

To check which migrations have been applied:

```bash
mysql -u root -p
```

Once logged in to MySQL:

```sql
USE whatsapp_web;
SELECT * FROM migrations ORDER BY applied_at;
```

## Resetting the Database

If you need to reset the database and start fresh:

```bash
node reset-db.js
```

This will drop all tables and prompt for confirmation first. After resetting, run migrations again:

```bash
node migrate.js
```
