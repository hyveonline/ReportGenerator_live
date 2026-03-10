const sql = require('mssql');
const config = require('./config/default').database;

async function checkIcons() {
    try {
        const pool = await sql.connect(config);
        
        const result = await pool.request().query(`
            SELECT TOP 10 ButtonID, ButtonName, Icon FROM MenuPermissions
        `);
        console.log('Current icons:');
        result.recordset.forEach(r => {
            console.log(`${r.ButtonID}: "${r.Icon}" - ${r.ButtonName}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkIcons();
