const sql = require('mssql');
const config = require('./config/default').database;

async function checkAreaAssignments() {
    try {
        const pool = await sql.connect(config);
        
        // Check Area Manager users and their assignments
        const result = await pool.request().query(`
            SELECT 
                u.id, 
                u.display_name, 
                u.email, 
                u.role,
                uaa.StoreID, 
                s.StoreCode, 
                s.StoreName, 
                s.Brand
            FROM Users u 
            LEFT JOIN UserAreaAssignments uaa ON u.id = uaa.UserID 
            LEFT JOIN Stores s ON uaa.StoreID = s.StoreID 
            WHERE u.role = 'AreaManager'
            ORDER BY u.display_name, s.Brand
        `);
        
        console.log('\n=== Area Manager Store Assignments ===\n');
        console.table(result.recordset);
        
        // Count per user
        const countResult = await pool.request().query(`
            SELECT 
                u.id,
                u.display_name,
                COUNT(uaa.StoreID) as store_count,
                STRING_AGG(s.Brand, ', ') as brands
            FROM Users u 
            LEFT JOIN UserAreaAssignments uaa ON u.id = uaa.UserID 
            LEFT JOIN Stores s ON uaa.StoreID = s.StoreID 
            WHERE u.role = 'AreaManager'
            GROUP BY u.id, u.display_name
        `);
        
        console.log('\n=== Store Count Per Area Manager ===\n');
        console.table(countResult.recordset);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAreaAssignments();
