/**
 * Check notification types and data in Notifications table
 */
const sql = require('mssql');
const dbConfig = require('./config/default').database;

async function checkNotifications() {
    try {
        const pool = await sql.connect(dbConfig);
        
        console.log('\n=== Distinct Notification Types ===');
        const types = await pool.request().query(`
            SELECT DISTINCT notification_type, COUNT(*) as cnt
            FROM Notifications
            GROUP BY notification_type
            ORDER BY notification_type
        `);
        console.table(types.recordset);
        
        console.log('\n=== Sample ActionPlanSubmitted Notifications ===');
        const submitted = await pool.request().query(`
            SELECT TOP 10 id, document_number, notification_type, recipient_name, recipient_email, sent_by_name, sent_at, status
            FROM Notifications
            WHERE notification_type = 'ActionPlanSubmitted'
            ORDER BY sent_at DESC
        `);
        console.table(submitted.recordset);
        
        console.log('\n=== Sample ActionPlanSubmittedToAreaManager Notifications ===');
        const toAM = await pool.request().query(`
            SELECT TOP 10 id, document_number, notification_type, recipient_name, recipient_email, sent_by_name, sent_at, status
            FROM Notifications
            WHERE notification_type = 'ActionPlanSubmittedToAreaManager'
            ORDER BY sent_at DESC
        `);
        console.table(toAM.recordset);
        
        console.log('\n=== All Notifications for a specific document ===');
        const doc = await pool.request().query(`
            SELECT TOP 1 document_number FROM Notifications WHERE notification_type = 'ActionPlanSubmitted'
        `);
        if (doc.recordset.length > 0) {
            const docNum = doc.recordset[0].document_number;
            console.log('Document:', docNum);
            const allForDoc = await pool.request()
                .input('docNum', sql.NVarChar, docNum)
                .query(`
                    SELECT id, notification_type, recipient_name, recipient_email, sent_by_name, sent_at, status
                    FROM Notifications
                    WHERE document_number = @docNum
                    ORDER BY sent_at DESC
                `);
            console.table(allForDoc.recordset);
        }
        
        console.log('\n=== Notifications Table Columns ===');
        const columns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Notifications'
            ORDER BY ORDINAL_POSITION
        `);
        console.table(columns.recordset);
        
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkNotifications();
