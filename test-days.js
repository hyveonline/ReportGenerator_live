const sql = require('mssql');
const config = require('./config/default').database;

async function test() {
    try {
        const pool = await sql.connect(config);
        
        // Check CreatedDate values
        const result = await pool.request().query(`
            SELECT TOP 10 
                apr.CreatedDate,
                apr.Status,
                DATEDIFF(day, apr.CreatedDate, GETDATE()) as DaysOpen,
                GETDATE() as Today
            FROM ActionPlanResponses apr
            WHERE apr.Status != 'Completed' OR apr.Status IS NULL
        `);
        
        console.log('Open Action Plan Items:');
        console.log(result.recordset);
        
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

test();
