const sql = require('mssql');
require('dotenv').config();

async function updateNotificationPreference() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    // Check if column exists
    const colCheck = await pool.request().query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'receive_notifications'
    `);
    
    if (colCheck.recordset.length === 0) {
        console.log('Adding receive_notifications column to Users table...');
        await pool.request().query(`
            ALTER TABLE Users ADD receive_notifications BIT DEFAULT 1
        `);
        console.log('Column added successfully');
    } else {
        console.log('Column already exists');
    }

    // Set Danielle Melhem to NOT receive notifications
    await pool.request()
        .input('email', sql.NVarChar, 'Danielle.Melhem@gmrlgroup.com')
        .query(`UPDATE Users SET receive_notifications = 0 WHERE email = @email`);
    
    const result = await pool.request()
        .input('email', sql.NVarChar, 'Danielle.Melhem@gmrlgroup.com')
        .query(`SELECT email, display_name, role, receive_notifications FROM Users WHERE email = @email`);
    
    console.log('Updated Danielle Melhem:', result.recordset[0]);
    
    // Show all SuperAuditors with notification status
    console.log('\nAll SuperAuditors notification status:');
    const superAuditors = await pool.request().query(`
        SELECT email, display_name, receive_notifications 
        FROM Users WHERE role = 'SuperAuditor' AND is_active = 1
    `);
    superAuditors.recordset.forEach(sa => {
        const status = sa.receive_notifications === false || sa.receive_notifications === 0 ? '❌ NO' : '✅ YES';
        console.log(`  ${sa.display_name} <${sa.email}> - Notifications: ${status}`);
    });
    
    await pool.close();
}

updateNotificationPreference().catch(err => console.error('Error:', err.message));
