/**
 * Script to check active sessions and diagnose email sender issues
 */
const sql = require('mssql');
const config = require('./config/default').database;

async function checkSessions() {
    const pool = await sql.connect(config);
    
    // Check all active sessions
    const result = await pool.request().query(`
        SELECT 
            s.id as session_id,
            s.user_id,
            u.email,
            u.display_name,
            s.created_at,
            s.last_activity,
            s.expires_at,
            LEN(s.azure_access_token) as token_length,
            LEFT(s.session_token, 30) as session_token_preview
        FROM Sessions s
        INNER JOIN Users u ON s.user_id = u.id
        WHERE s.expires_at > GETDATE()
        ORDER BY s.last_activity DESC
    `);
    
    console.log('=== Active Sessions ===');
    result.recordset.forEach(row => {
        console.log(`- ${row.email} (${row.display_name})`);
        console.log(`  Session ID: ${row.session_id}, User ID: ${row.user_id}`);
        console.log(`  Token Length: ${row.token_length}`);
        console.log(`  Last Activity: ${row.last_activity}`);
        console.log(`  Session Token: ${row.session_token_preview}...`);
        console.log('');
    });
    
    // Check for Muhammad.shammas specifically
    console.log('\n=== Looking for Muhammad.shammas ===');
    const shammasResult = await pool.request().query(`
        SELECT 
            u.id, u.email, u.display_name, u.role,
            s.id as session_id,
            LEN(s.azure_access_token) as token_length,
            LEN(s.azure_refresh_token) as refresh_token_length
        FROM Users u
        LEFT JOIN Sessions s ON u.id = s.user_id AND s.expires_at > GETDATE()
        WHERE u.email LIKE '%shammas%' OR u.display_name LIKE '%shammas%'
    `);
    
    if (shammasResult.recordset.length > 0) {
        shammasResult.recordset.forEach(row => {
            console.log(`User: ${row.email} (${row.display_name})`);
            console.log(`  User ID: ${row.id}, Role: ${row.role}`);
            console.log(`  Session ID: ${row.session_id || 'NO ACTIVE SESSION'}`);
            console.log(`  Access Token Length: ${row.token_length || 'N/A'}`);
            console.log(`  Refresh Token Length: ${row.refresh_token_length || 'N/A'}`);
        });
    } else {
        console.log('No user found matching "shammas"');
    }
    
    // Check for Kantari
    console.log('\n=== Looking for Kantari ===');
    const kantariResult = await pool.request().query(`
        SELECT 
            u.id, u.email, u.display_name, u.role,
            s.id as session_id,
            LEN(s.azure_access_token) as token_length
        FROM Users u
        LEFT JOIN Sessions s ON u.id = s.user_id AND s.expires_at > GETDATE()
        WHERE u.email LIKE '%kantari%' OR u.display_name LIKE '%kantari%'
    `);
    
    if (kantariResult.recordset.length > 0) {
        kantariResult.recordset.forEach(row => {
            console.log(`User: ${row.email} (${row.display_name})`);
            console.log(`  User ID: ${row.id}, Role: ${row.role}`);
            console.log(`  Session ID: ${row.session_id || 'NO ACTIVE SESSION'}`);
            console.log(`  Access Token Length: ${row.token_length || 'N/A'}`);
        });
    } else {
        console.log('No user found matching "kantari"');
    }
    
    process.exit(0);
}

checkSessions().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
