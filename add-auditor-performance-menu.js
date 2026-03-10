const sql = require('mssql');
const config = require('./config/default').database;

async function addMenu() {
    try {
        const pool = await sql.connect(config);
        
        // Check if already exists
        const check = await pool.request().query(`
            SELECT * FROM MenuPermissions WHERE ButtonID = 'auditorPerformanceBtn'
        `);
        
        if (check.recordset.length > 0) {
            console.log('⚠️ Menu permission already exists');
            process.exit(0);
        }
        
        await pool.request().query(`
            INSERT INTO MenuPermissions (ButtonID, ButtonName, Category, Icon, Url, ActionType, AllowedRoles, EditRoles, IsEnabled, SortOrder) 
            VALUES ('auditorPerformanceBtn', 'Auditor Performance', 'Reports', '👨‍💼', '/admin/auditor-performance', 'navigate', 'Admin,SuperAuditor', 'Admin', 1, 15)
        `);
        
        console.log('✅ Auditor Performance menu permission added');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

addMenu();
