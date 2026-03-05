const sql = require('mssql');

const dbConfig = {
    server: 'localhost',
    database: 'FoodSafetyDB_Live',
    user: 'sa',
    password: 'Kokowawa123@@',
    options: { encrypt: false, trustServerCertificate: true }
};

async function check() {
    const pool = await sql.connect(dbConfig);
    
    // Check current AuditInstances columns
    const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'AuditInstances'
        ORDER BY ORDINAL_POSITION
    `);
    console.log('=== AuditInstances columns ===');
    cols.recordset.forEach(c => console.log(c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE));
    
    // Check if re-audit columns already exist
    const hasReaudit = cols.recordset.some(c => c.COLUMN_NAME === 'IsReaudit');
    console.log('\nIsReaudit column exists:', hasReaudit);
    
    await pool.close();
}
check();
