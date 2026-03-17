const sql = require('mssql');
const config = require('./config/default').database;

async function test() {
    try {
        const pool = await sql.connect(config);
        
        // Check what notification types exist
        const types = await pool.request().query('SELECT DISTINCT notification_type FROM Notifications');
        console.log('Notification types in database:');
        console.log(types.recordset);
        
        // Check if ActionPlanSubmittedToAreaManager exists
        const amNotifs = await pool.request().query(`
            SELECT TOP 5 document_number, notification_type, recipient_name, status, sent_at 
            FROM Notifications 
            WHERE notification_type LIKE '%AreaManager%' OR notification_type LIKE '%Area%'
        `);
        console.log('\nArea Manager notifications:');
        console.log(amNotifs.recordset);
        
        // Check ActionPlanSubmitted notifications
        const apNotifs = await pool.request().query(`
            SELECT TOP 5 document_number, notification_type, sent_by_name, recipient_name, status 
            FROM Notifications 
            WHERE notification_type = 'ActionPlanSubmitted'
        `);
        console.log('\nActionPlanSubmitted notifications:');
        console.log(apNotifs.recordset);
        
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}
test();
