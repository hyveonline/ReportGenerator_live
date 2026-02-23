/**
 * Script to diagnose token ownership issues
 * Checks if the access token in the session matches the expected user
 */
const sql = require('mssql');
const config = require('./config/default').database;

async function diagnoseTokens() {
    const pool = await sql.connect(config);
    
    // Get all active sessions with their tokens
    const result = await pool.request().query(`
        SELECT 
            s.id as session_id,
            s.user_id,
            u.email as expected_email,
            u.display_name as expected_name,
            s.azure_access_token,
            s.azure_refresh_token,
            s.created_at,
            s.last_activity
        FROM Sessions s
        INNER JOIN Users u ON s.user_id = u.id
        WHERE s.expires_at > GETDATE()
        ORDER BY s.last_activity DESC
    `);
    
    console.log('=== Diagnosing Token Ownership ===\n');
    
    for (const row of result.recordset) {
        console.log(`\n📧 Session for: ${row.expected_email} (${row.expected_name})`);
        console.log(`   Session ID: ${row.session_id}, User ID: ${row.user_id}`);
        
        if (!row.azure_access_token) {
            console.log(`   ❌ No access token stored!`);
            continue;
        }
        
        // Check who owns this token
        try {
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { 'Authorization': `Bearer ${row.azure_access_token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const actualEmail = data.mail || data.userPrincipalName;
                const actualName = data.displayName;
                
                if (actualEmail.toLowerCase() === row.expected_email.toLowerCase()) {
                    console.log(`   ✅ Token CORRECT - Belongs to: ${actualEmail}`);
                } else {
                    console.log(`   ⚠️ TOKEN MISMATCH!`);
                    console.log(`      Expected: ${row.expected_email}`);
                    console.log(`      Actual:   ${actualEmail} (${actualName})`);
                    console.log(`      This session has WRONG user's token!`);
                }
            } else if (response.status === 401) {
                console.log(`   ⏰ Token EXPIRED - needs refresh`);
            } else {
                console.log(`   ❓ Token check failed: ${response.status}`);
            }
        } catch (err) {
            console.log(`   ❌ Error checking token: ${err.message}`);
        }
    }
    
    console.log('\n=== Diagnosis Complete ===');
    process.exit(0);
}

diagnoseTokens().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
