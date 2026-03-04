const sql = require('mssql');

async function checkSchema() {
    const pool = await sql.connect({
        server: 'localhost',
        database: 'FoodSafetyDB_Live',
        user: 'sa',
        password: 'Kokowawa123@@',
        options: { encrypt: false, trustServerCertificate: true }
    });
    
    console.log('\nArea Managers with assigned_stores:');
    const r1 = await pool.request().query(`
        SELECT TOP 10 id, email, display_name, role, assigned_stores
        FROM Users 
        WHERE role = 'AreaManager' AND is_active = 1 AND assigned_stores IS NOT NULL
    `);
    console.table(r1.recordset);
    
    console.log('\nSample store: Cold Stone Signature');
    const r2 = await pool.request().query(`SELECT * FROM Stores WHERE StoreName LIKE '%Cold Stone%'`);
    console.table(r2.recordset);
    
    console.log('\nArea Managers assigned to Cold Stone Signature (via assigned_stores JSON):');
    const r3 = await pool.request().query(`
        SELECT id, email, display_name, role, assigned_stores
        FROM Users 
        WHERE role = 'AreaManager' 
        AND is_active = 1 
        AND assigned_stores LIKE '%Cold Stone%'
    `);
    console.table(r3.recordset);
    
    console.log('\nAll AreaManager assignments via StoreManagerAssignments:');
    const r4 = await pool.request().query(`
        SELECT sma.*, u.email, u.display_name, u.role, s.StoreName
        FROM StoreManagerAssignments sma
        INNER JOIN Users u ON u.id = sma.UserID
        INNER JOIN Stores s ON s.StoreID = sma.StoreID
        WHERE u.role = 'AreaManager'
    `);
    console.log(`Total: ${r4.recordset.length} records`);
    
    await pool.close();
}

checkSchema().catch(console.error);
