const sql = require('mssql');
const config = require('./config/default').database;

async function test() {
    try {
        const pool = await sql.connect(config);
        
        // Test the action plan query
        const result = await pool.request().query(`
            SELECT 
                ai.StoreName,
                COUNT(*) as Total,
                SUM(CASE WHEN apr.Status = 'Completed' THEN 1 ELSE 0 END) as Closed,
                SUM(CASE WHEN apr.Status != 'Completed' OR apr.Status IS NULL THEN 1 ELSE 0 END) as Open
            FROM ActionPlanResponses apr
            INNER JOIN AuditInstances ai ON apr.DocumentNumber = ai.DocumentNumber
            WHERE ai.Status = 'Completed'
            GROUP BY ai.StoreName
            ORDER BY ai.StoreName
        `);
        
        console.log('Action Plan by Store:', result.recordset.length, 'rows');
        console.log(result.recordset.slice(0, 3));
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

test();
