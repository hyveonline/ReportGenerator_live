/**
 * Check what emails are configured to receive automated notifications
 */
const sql = require('mssql');
require('dotenv').config();

async function checkNotificationRecipients() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    console.log('\n=== AUTOMATED NOTIFICATION RECIPIENTS ===\n');

    // 1. System Sender (who sends the emails)
    console.log('📧 SYSTEM SENDER EMAIL:');
    console.log('   ' + (process.env.SYSTEM_SENDER_EMAIL || 'spnotification@spinneys-lebanon.com'));

    // 2. SuperAuditors (CC on escalation/overdue emails)
    console.log('\n👥 SUPERAUDITORS (CC on escalations):');
    const superAuditors = await pool.request().query(`
        SELECT email, display_name, receive_notifications 
        FROM Users 
        WHERE role = 'SuperAuditor' AND is_active = 1
        AND (receive_notifications = 1 OR receive_notifications IS NULL)
    `);
    if (superAuditors.recordset.length === 0) {
        console.log('   No active SuperAuditors found');
    } else {
        superAuditors.recordset.forEach(sa => {
            console.log('   - ' + sa.display_name + ' <' + sa.email + '>');
        });
    }

    // 3. Store Managers (receive reminders/overdue notices)
    console.log('\n🏪 STORE MANAGERS (receive action plan reminders):');
    const storeManagers = await pool.request().query(`
        SELECT u.email, u.display_name, s.StoreName
        FROM Users u
        INNER JOIN StoreManagerAssignments sma ON u.id = sma.UserId
        INNER JOIN Stores s ON sma.StoreId = s.StoreID
        WHERE u.is_active = 1
        ORDER BY s.StoreName
    `);
    if (storeManagers.recordset.length === 0) {
        console.log('   No Store Managers with store assignments found');
    } else {
        storeManagers.recordset.forEach(sm => {
            console.log('   - ' + sm.display_name + ' <' + sm.email + '> - ' + sm.StoreName);
        });
    }

    // 4. Area Managers (receive escalations)
    console.log('\n📋 AREA MANAGERS (receive escalations):');
    const areaManagers = await pool.request().query(`
        SELECT DISTINCT u.email, u.display_name
        FROM Users u
        INNER JOIN UserAreaAssignments uaa ON u.id = uaa.UserID
        WHERE u.is_active = 1
    `);
    if (areaManagers.recordset.length === 0) {
        console.log('   No Area Managers with area assignments found');
    } else {
        areaManagers.recordset.forEach(am => {
            console.log('   - ' + am.display_name + ' <' + am.email + '>');
        });
    }

    // 5. Escalation Settings
    console.log('\n⚙️ ESCALATION SETTINGS:');
    const settings = await pool.request().query(`
        SELECT DeadlineDays, ReminderDaysBefore, AutoEscalationEnabled, EmailNotificationsEnabled, EscalationRecipients, GracePeriodHours, MaxReminders
        FROM ActionPlanEscalationSettings
    `);
    if (settings.recordset.length > 0) {
        const s = settings.recordset[0];
        console.log('   Deadline Days: ' + s.DeadlineDays);
        console.log('   Reminder Days Before: ' + s.ReminderDaysBefore);
        console.log('   Auto Escalation Enabled: ' + s.AutoEscalationEnabled);
        console.log('   Email Notifications Enabled: ' + s.EmailNotificationsEnabled);
        console.log('   Escalation Recipients: ' + s.EscalationRecipients);
        console.log('   Grace Period Hours: ' + s.GracePeriodHours);
        console.log('   Max Reminders: ' + s.MaxReminders);
    } else {
        console.log('   No escalation settings found (using defaults)');
    }

    // 6. Recent notification log
    console.log('\n📜 RECENT EMAIL LOGS (last 10):');
    const logs = await pool.request().query(`
        SELECT TOP 10 RecipientEmail, RecipientRole, EventType, DocumentNumber, StoreName, Status, CreatedAt
        FROM EscalationJobLog
        WHERE RecipientEmail IS NOT NULL
        ORDER BY CreatedAt DESC
    `);
    if (logs.recordset.length === 0) {
        console.log('   No email logs found');
    } else {
        logs.recordset.forEach(log => {
            const date = new Date(log.CreatedAt).toLocaleString('en-GB');
            console.log('   ' + date + ' | ' + log.EventType + ' | ' + log.RecipientEmail + ' | ' + log.StoreName + ' | ' + log.Status);
        });
    }

    await pool.close();
}

checkNotificationRecipients().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
