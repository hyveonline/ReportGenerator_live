/**
 * Check cycle values in CycleDefinitions vs AuditInstances
 */
const sql = require('mssql');
const dbConfig = require('./config/default').database;

async function checkCycles() {
    try {
        const pool = await sql.connect(dbConfig);
        
        console.log('\n=== Cycle Definitions ===');
        const cycleDefs = await pool.request().query(`
            SELECT CycleDefID, CycleTypeID, CycleNumber, CycleName, StartMonth, EndMonth, DisplayOrder, IsActive
            FROM CycleDefinitions
            ORDER BY CycleTypeID, DisplayOrder
        `);
        console.table(cycleDefs.recordset);
        
        console.log('\n=== Distinct Cycles in AuditInstances ===');
        const auditCycles = await pool.request().query(`
            SELECT DISTINCT Cycle, COUNT(*) as AuditCount
            FROM AuditInstances 
            WHERE Status = 'Completed'
            GROUP BY Cycle
            ORDER BY Cycle
        `);
        console.table(auditCycles.recordset);
        
        console.log('\n=== Cycles API would return ===');
        const apiCycles = await pool.request().query(`
            SELECT DISTINCT CycleName as name FROM CycleDefinitions WHERE CycleName IS NOT NULL
            UNION
            SELECT DISTINCT Cycle as name FROM AuditInstances WHERE Cycle IS NOT NULL AND Cycle != ''
            ORDER BY name
        `);
        console.table(apiCycles.recordset);
        
        console.log('\n=== Sample Audits with Cycle ===');
        const sampleAudits = await pool.request().query(`
            SELECT TOP 10 AuditID, DocumentNumber, StoreName, Cycle, Year, TotalScore
            FROM AuditInstances
            WHERE Status = 'Completed'
            ORDER BY AuditDate DESC
        `);
        console.table(sampleAudits.recordset);
        
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCycles();
