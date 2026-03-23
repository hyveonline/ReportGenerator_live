const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    await sql.connect(config);
    
    // Get audit details
    const audit = await sql.query`
        SELECT a.AuditID, a.DocumentNumber, a.StoreName, a.StoreCode, a.SchemaID, 
               a.Cycle, a.Year, a.AuditDate, a.Status, a.CreatedAt,
               s.SchemaName
        FROM AuditInstances a
        LEFT JOIN AuditSchemas s ON a.SchemaID = s.SchemaID
        WHERE a.DocumentNumber LIKE '%QCACCSC%0029%'
    `;
    
    console.log('Audit Details:');
    console.log(JSON.stringify(audit.recordset, null, 2));
    
    // Check cycle definitions
    const cycles = await sql.query`SELECT * FROM CycleDefinitions WHERE CycleName LIKE '%Week%' ORDER BY CycleTypeID, DisplayOrder`;
    console.log('\nBiweekly Cycle Definitions:');
    console.log(JSON.stringify(cycles.recordset, null, 2));
    
    // Check cycle types
    const cycleTypes = await sql.query`SELECT * FROM CycleTypes`;
    console.log('\nCycle Types:');
    console.log(JSON.stringify(cycleTypes.recordset, null, 2));
    
    // Check schema 31's cycle type - including IsDefault
    const schemaInfo = await sql.query`
        SELECT s.SchemaID, s.SchemaName, sct.CycleTypeID, sct.IsDefault, ct.TypeName, ct.TypeCode
        FROM AuditSchemas s 
        LEFT JOIN SchemaCycleTypes sct ON s.SchemaID = sct.SchemaID
        LEFT JOIN CycleTypes ct ON sct.CycleTypeID = ct.CycleTypeID
        WHERE s.SchemaID = 31`;
    console.log('\nSchema 31 Cycle Types:');
    console.log(JSON.stringify(schemaInfo.recordset, null, 2));
    
    // What cycles does getCyclesForSchema return (default)?
    const cyclesForSchema = await sql.query`
        SELECT 
            cd.CycleNumber,
            cd.CycleName,
            ct.TypeName as CycleTypeName,
            sct.IsDefault
        FROM SchemaCycleTypes sct
        INNER JOIN CycleTypes ct ON sct.CycleTypeID = ct.CycleTypeID
        INNER JOIN CycleDefinitions cd ON ct.CycleTypeID = cd.CycleTypeID
        WHERE sct.SchemaID = 31 AND sct.IsDefault = 1 AND cd.IsActive = 1
        ORDER BY cd.DisplayOrder`;
    console.log('\nCycles loaded for Schema 31 (default cycle type):');
    console.log(`Count: ${cyclesForSchema.recordset.length}`);
    if (cyclesForSchema.recordset.length > 0) {
        console.log(`Type: ${cyclesForSchema.recordset[0].CycleTypeName}`);
        console.log('First 5:', cyclesForSchema.recordset.slice(0, 5).map(c => `${c.CycleNumber}=${c.CycleName}`).join(', '));
    }
    
    sql.close();
}

check().catch(console.error);
