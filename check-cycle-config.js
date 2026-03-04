require('dotenv').config();
const sql = require('mssql');

async function checkSchemaStructure() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    // Check AuditSchemas columns
    console.log('=== AuditSchemas Table Columns ===');
    const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'AuditSchemas'
        ORDER BY ORDINAL_POSITION
    `);
    console.table(cols.recordset);

    // Check existing schemas
    console.log('\n=== Existing Schemas ===');
    const schemas = await pool.request().query(`SELECT * FROM AuditSchemas`);
    console.table(schemas.recordset);

    // Check how cycle is used in AuditInstances
    console.log('\n=== Sample Cycles in AuditInstances ===');
    const cycles = await pool.request().query(`
        SELECT DISTINCT s.SchemaName, ai.Cycle, ai.Year, COUNT(*) as Count
        FROM AuditInstances ai
        JOIN AuditSchemas s ON ai.SchemaID = s.SchemaID
        GROUP BY s.SchemaName, ai.Cycle, ai.Year
        ORDER BY s.SchemaName, ai.Year, ai.Cycle
    `);
    console.table(cycles.recordset);

    await pool.close();
}

checkSchemaStructure().catch(console.error);
