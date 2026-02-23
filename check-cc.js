const sql = require('mssql');
const config = require('./config/default').database;

async function main() {
    const pool = await sql.connect(config);
    
    // Check all recipients for GMRL-FSACSG-1221-0010
    const notifications = await pool.request()
        .input('docNum', sql.NVarChar, 'GMRL- FSACSS - 0725-0001')
        .query(`
            SELECT recipient_email, recipient_role, notification_type, sent_by_email, sent_by_name, sent_at
            FROM Notifications 
            WHERE document_number = @docNum 
            ORDER BY sent_at DESC
        `);
    console.log('All notifications for GMRL-FSACSG-1221-0010:');
    console.log(JSON.stringify(notifications.recordset, null, 2));
    
    await pool.close();
}

main().catch(console.error);
