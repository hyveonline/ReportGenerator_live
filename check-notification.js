const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    const pool = await sql.connect(config);
    
    // Check all columns for this notification - exact match with FSACSS
    const result = await pool.request()
        .query(`SELECT * FROM Notifications WHERE document_number LIKE '%FSACSS%0725-0005%'`);
    
    console.log('Notifications for FSACSS 0725-0005:');
    console.log('Total found:', result.recordset.length);
    
    if (result.recordset.length > 0) {
        const row = result.recordset[0];
        console.log('\nFirst record columns:');
        Object.keys(row).forEach(key => {
            console.log(`  ${key}: ${row[key]}`);
        });
    }
    
    await pool.close();
}

check().catch(console.error);
