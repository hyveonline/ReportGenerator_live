const sql = require('mssql');
const config = require('./config/default').database;

async function checkAuditItems() {
    await sql.connect(config);
    
    // Get audit responses for audit 68 where reference starts with 1.
    const result = await sql.query`
        SELECT ResponseID, ReferenceValue, SelectedChoice, Finding, SectionName
        FROM AuditResponses 
        WHERE AuditID = 68
        AND (SelectedChoice = 'No' OR SelectedChoice = 'Partially')
        AND ReferenceValue LIKE '1.%'
        ORDER BY ReferenceValue
    `;
    
    console.log('Audit items in Section 1 with No/Partially for audit 68:');
    console.log('');
    
    result.recordset.forEach(r => {
        console.log(`${r.ReferenceValue}: Choice=${r.SelectedChoice}, Section=${r.SectionName}`);
        console.log(`   Finding: ${r.Finding ? r.Finding.substring(0, 80) : 'NULL'}`);
    });
    
    console.log('');
    console.log('---');
    console.log('');
    
    // Now check saved action plan responses
    const saved = await sql.query`
        SELECT ResponseID, ReferenceValue, ActionTaken, Status
        FROM ActionPlanResponses 
        WHERE DocumentNumber = 'GMRL-FSACSG-1221-0023'
        AND ReferenceValue LIKE '1.%'
        ORDER BY ReferenceValue
    `;
    
    console.log('Saved Action Plan responses for Section 1:');
    console.log('');
    
    saved.recordset.forEach(r => {
        console.log(`${r.ReferenceValue}: Status=${r.Status}, ActionTaken=${r.ActionTaken ? r.ActionTaken.substring(0, 50) : 'NULL'}`);
    });
    
    await sql.close();
}
checkAuditItems().catch(e => console.error(e));
