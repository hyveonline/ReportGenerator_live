const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    await sql.connect(config);
    
    // Check action plan responses for audit 68
    const result = await sql.query`
        SELECT ResponseID, ReferenceValue, ActionTaken, Status, PersonInCharge
        FROM ActionPlanResponses 
        WHERE DocumentNumber = 'GMRL-FSACSG-1221-0023'
        ORDER BY ReferenceValue
    `;
    
    console.log('Action Plan Responses for audit 68 (GMRL-FSACSG-1221-0023):');
    console.log('Total:', result.recordset.length);
    console.log('');
    
    result.recordset.forEach(r => {
        const actionTaken = r.ActionTaken ? r.ActionTaken.substring(0, 80) : 'NULL';
        console.log(`${r.ReferenceValue}: Status=${r.Status || 'NULL'}, PIC=${r.PersonInCharge || 'NULL'}`);
        console.log(`   ActionTaken: ${actionTaken}`);
        console.log('');
    });
    
    await sql.close();
}
check().catch(e => console.error(e));
