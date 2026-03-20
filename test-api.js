const sql = require('mssql');
const config = require('./config/default').database;

async function testAPI() {
    await sql.connect(config);
    
    // Call the same stored procedure the API uses
    const request = new sql.Request();
    request.input('DocumentNumber', sql.NVarChar(50), 'GMRL-FSACSG-1221-0023');
    
    const result = await request.execute('sp_GetActionPlanResponses');
    
    console.log('API would return', result.recordset.length, 'records');
    console.log('');
    console.log('First 3 records:');
    result.recordset.slice(0, 3).forEach((r, i) => {
        console.log(`\nRecord ${i + 1}:`);
        console.log('  ReferenceValue:', r.ReferenceValue);
        console.log('  ActionTaken:', r.ActionTaken);
        console.log('  Status:', r.Status);
    });
    
    // Check if 1.10 is there
    const item110 = result.recordset.find(r => r.ReferenceValue === '1.10');
    console.log('\n--- Item 1.10 ---');
    if (item110) {
        console.log('Found 1.10:');
        console.log('  ActionTaken:', item110.ActionTaken);
        console.log('  Status:', item110.Status);
    } else {
        console.log('1.10 NOT FOUND in API response!');
    }
    
    await sql.close();
}
testAPI().catch(e => console.error(e));
