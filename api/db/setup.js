const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const setupDatabase = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('Synchronizing database schema...');
        await pool.query(schema);
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing database:', error.message);
    }
};

module.exports = {
    pool,
    setupDatabase
};
