const sql = require('mssql');
const config = require('./config/default').database;

async function addColumn() {
    try {
        const pool = await sql.connect(config);
        
        // Add StandardAuditDuration column to Stores if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Stores') AND name = 'StandardAuditDuration')
            ALTER TABLE Stores ADD StandardAuditDuration INT NULL
        `);
        
        console.log('✅ StandardAuditDuration column added to Stores table');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addColumn();
