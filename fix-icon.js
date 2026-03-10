const sql = require('mssql');
const config = require('./config/default').database;

async function fixIcon() {
    try {
        const pool = await sql.connect(config);
        
        // Update the icon - use text name like other buttons
        await pool.request()
            .input('icon', sql.NVarChar, 'user-check')
            .query(`
                UPDATE MenuPermissions 
                SET Icon = @icon
                WHERE ButtonID = 'auditorPerformanceBtn'
            `);
        
        console.log('✅ Icon updated to 👨‍💼');
        
        // Verify
        const result = await pool.request().query(`
            SELECT ButtonID, ButtonName, Icon FROM MenuPermissions WHERE ButtonID = 'auditorPerformanceBtn'
        `);
        console.log(result.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

fixIcon();
