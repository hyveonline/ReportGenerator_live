const sql = require('mssql');

async function checkAuditors() {
    const pool = await sql.connect({
        server: 'localhost',
        database: 'FoodSafetyDB_Live',
        user: 'sa',
        password: 'Kokowawa123@@',
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    });
    
    const result = await pool.request().query(`
        SELECT id, email, display_name, role 
        FROM Users 
        WHERE role IN ('SuperAuditor', 'Auditor') AND is_active = 1
    `);
    
    console.log('Auditors and SuperAuditors:');
    console.table(result.recordset);
    
    // Also check system sender
    const senderResult = await pool.request().query(`
        SELECT TOP 1 u.email, u.display_name, u.role, s.expires_at
        FROM Users u
        INNER JOIN Sessions s ON u.id = s.user_id
        WHERE u.email = 'spnotification@spinneys-lebanon.com'
        ORDER BY s.created_at DESC
    `);
    
    console.log('\nSystem Sender (spnotification):');
    console.table(senderResult.recordset);
    
    await pool.close();
}

checkAuditors().catch(console.error);
