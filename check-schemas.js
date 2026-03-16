const sql = require('mssql');
require('dotenv').config();

async function getSchemaInfo() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    // Get schemas with passing grades
    const schemas = await pool.request().query(`
        SELECT s.SchemaID, s.SchemaName, ss.PassingGrade 
        FROM AuditSchemas s 
        LEFT JOIN SystemSettings ss ON s.SchemaID = ss.SchemaID AND ss.SettingType = 'Overall' 
        WHERE s.IsActive = 1
        ORDER BY s.SchemaName
    `);
    console.log('Schemas with Passing Grades:');
    console.table(schemas.recordset);

    // Get brands from Stores
    const brands = await pool.request().query(`
        SELECT DISTINCT Brand FROM Stores WHERE Brand IS NOT NULL ORDER BY Brand
    `);
    console.log('\nBrands in Stores:');
    console.table(brands.recordset);

    await pool.close();
}

getSchemaInfo().catch(e => console.error(e.message));
