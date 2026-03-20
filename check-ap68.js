const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    try {
        await sql.connect(config);
        
        // Get the document number for audit ID 68
        const auditResult = await sql.query`SELECT DocumentNumber, StoreName, Status FROM AuditInstances WHERE AuditID = 68`;
        const audit = auditResult.recordset[0];
        console.log('Audit 68:', audit);
        
        if (!audit) {
            console.log('Audit 68 not found!');
            return;
        }
        
        // Check action plan responses
        const apResult = await sql.query`
            SELECT ResponseID, DocumentNumber, ReferenceValue, Section, Status, 
                   ActionTaken, UpdatedBy, UpdatedDate 
            FROM ActionPlanResponses 
            WHERE DocumentNumber = ${audit.DocumentNumber}
            ORDER BY UpdatedDate DESC
        `;
        console.log('\nAction Plan Responses:', apResult.recordset.length);
        console.log(JSON.stringify(apResult.recordset.slice(0, 5), null, 2));
        
        // Check audit log for recent changes
        const logResult = await sql.query`
            SELECT TOP 10 * FROM ActionPlanAuditLog 
            WHERE ResponseID IN (SELECT ResponseID FROM ActionPlanResponses WHERE DocumentNumber = ${audit.DocumentNumber})
            ORDER BY ChangeDate DESC
        `;
        console.log('\nRecent Audit Log:', logResult.recordset.length);
        console.log(JSON.stringify(logResult.recordset.slice(0, 3), null, 2));
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sql.close();
    }
}

check();
