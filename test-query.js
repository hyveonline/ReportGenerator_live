const sql = require('mssql');
const cfg = require('./config/default').database;

async function test() {
    try {
        const pool = await sql.connect(cfg);
        
        // Test with subquery for DISTINCT
        console.log('Testing fixed query...');
        const result = await pool.request().query(`
            SELECT STRING_AGG(x.recipient_name, ', ') as names 
            FROM (
                SELECT DISTINCT recipient_name
                FROM Notifications 
                WHERE document_number = 'GMRL- FSACSS - 0725-0015' 
                AND recipient_role = 'AreaManager'
            ) x
        `);
        console.log('Result:', result.recordset);
        
        await pool.close();
    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

test();
