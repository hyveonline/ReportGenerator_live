const sql = require('mssql');
require('dotenv').config();

(async () => {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });
    
    // Check all stores with 509 in name or code
    const stores = await pool.request().query(`
        SELECT StoreID, StoreName, StoreCode, Brand, IsActive 
        FROM Stores
        WHERE StoreName LIKE '%509%' OR StoreCode LIKE '%509%' OR StoreName LIKE '%Dbayeh%'
        ORDER BY StoreID
    `);
    
    console.log('Stores with 509 or Dbayeh:');
    stores.recordset.forEach(s => {
        console.log(`  ID: ${s.StoreID} | Code: ${s.StoreCode} | Name: ${s.StoreName} | Brand: ${s.Brand} | Active: ${s.IsActive}`);
    });
    
    await pool.close();
})();
