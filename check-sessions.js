const sql = require('mssql');
const config = require('./config/default').database;

async function main() {
    const pool = await sql.connect(config);
    
    // Check if tokens are the same between sessions
    const result = await pool.request().query(`
        SELECT 
            s.id, 
            s.user_id, 
            u.email, 
            LEFT(s.azure_access_token, 80) as token_preview,
            s.last_activity
        FROM Sessions s 
        INNER JOIN Users u ON s.user_id = u.id 
        WHERE s.expires_at > GETDATE()
        ORDER BY s.last_activity DESC
    `);
    
    console.log('Active Sessions:');
    console.log(JSON.stringify(result.recordset, null, 2));
    
    // Check if any two sessions have the same token
    const tokens = result.recordset.map(r => r.token_preview);
    const duplicates = tokens.filter((item, index) => tokens.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
        console.log('\n⚠️ WARNING: DUPLICATE TOKENS FOUND!');
        console.log(duplicates);
    } else {
        console.log('\n✅ No duplicate tokens found');
    }
    
    await pool.close();
}

main().catch(console.error);
