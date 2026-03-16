const sql = require('mssql');
require('dotenv').config();

async function test() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    try {
        const result = await pool.request().query(`
            SELECT TOP 5
                ai.StoreName,
                apr.Finding as Finding,
                apr.ReferenceValue,
                ai.DocumentNumber,
                DATEDIFF(day, ai.AuditDate, GETDATE()) as DaysOpen,
                apr.Status
            FROM ActionPlanResponses apr
            INNER JOIN AuditInstances ai ON apr.DocumentNumber = ai.DocumentNumber
            WHERE ai.Status = 'Completed'
            AND (apr.Status != 'Completed' OR apr.Status IS NULL)
            ORDER BY ai.StoreName, DaysOpen DESC
        `);
        console.log('Query works! Found', result.recordset.length, 'rows');
        if (result.recordset.length > 0) {
            console.log('Sample:', result.recordset[0]);
        }
    } catch (e) {
        console.error('Query failed:', e.message);
    }
    await pool.close();
}
test();
