require('dotenv').config();
const sql = require('mssql');

async function checkStoreSchema() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    // Check Stores table structure
    console.log('=== Stores Table Columns ===');
    const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Stores' 
        ORDER BY ORDINAL_POSITION
    `);
    cols.recordset.forEach(c => console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    // Check sample stores with their schemas
    console.log('\n=== Sample Stores with Schemas ===');
    const stores = await pool.request().query(`
        SELECT TOP 10 s.StoreID, s.StoreCode, s.StoreName, s.SchemaID, 
               sc.SchemaName
        FROM Stores s
        LEFT JOIN AuditSchemas sc ON s.SchemaID = sc.SchemaID
        ORDER BY s.StoreName
    `);
    console.table(stores.recordset);

    // Check if StoreSchemas junction table exists
    console.log('\n=== Checking for StoreSchemas table ===');
    const tables = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE '%Store%Schema%' OR TABLE_NAME LIKE '%Schema%Store%'
    `);
    console.log('Found tables:', tables.recordset.length > 0 ? tables.recordset : 'None');

    await pool.close();
}

checkStoreSchema().catch(console.error);
