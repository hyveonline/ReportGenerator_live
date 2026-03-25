const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    const pool = await sql.connect(config);
    
    // Check all HeadOfOperations users
    const hoUsers = await pool.request().query(`
        SELECT id, email, display_name, role, is_active
        FROM Users
        WHERE role = 'HeadOfOperations'
    `);
    console.log('HeadOfOperations Users:');
    console.log(hoUsers.recordset);
    
    // Check their store assignments
    const hoAssignments = await pool.request().query(`
        SELECT u.email, u.display_name, u.role, uaa.StoreID, s.StoreName
        FROM UserAreaAssignments uaa
        INNER JOIN Users u ON uaa.UserID = u.id
        LEFT JOIN Stores s ON uaa.StoreID = s.StoreID
        WHERE u.role = 'HeadOfOperations'
    `);
    console.log('\nHeadOfOperations Store Assignments:');
    console.log(hoAssignments.recordset);
    
    process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
