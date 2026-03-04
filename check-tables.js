const sql = require('mssql');
const config = { server: 'localhost', database: 'FoodSafetyDB_Live', user: 'sa', password: 'Kokowawa123@@', options: { encrypt: false, trustServerCertificate: true } };

sql.connect(config).then(async () => {
    const r = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MenuPermissions'");
    console.log('MenuPermissions columns:', r.recordset);
    
    const sample = await sql.query("SELECT TOP 5 * FROM MenuPermissions");
    console.log('Sample data:', sample.recordset);
    
    await sql.close();
}).catch(e => console.error(e.message));
