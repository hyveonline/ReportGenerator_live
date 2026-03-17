const sql = require('mssql');
const config = require('./config/default').database;

async function test() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT COUNT(DISTINCT document_number) as ReviewedCount
            FROM NotificationHistory
            WHERE notification_type = 'ActionPlanSubmitted'
            AND status = 'Sent'
        `);
        console.log('Query result:', result.recordset);
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}
test();
