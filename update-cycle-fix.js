const sql = require('mssql');
require('dotenv').config();

async function updateCycle() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    const docs = ['GMRL-FSACSG-1221-0023', 'GMRL-FSACSG-1221-0020'];

    console.log('Before update:');
    for (const doc of docs) {
        const r = await pool.request()
            .input('doc', sql.NVarChar, doc)
            .query('SELECT DocumentNumber, StoreName, Cycle FROM AuditInstances WHERE DocumentNumber = @doc');
        if (r.recordset.length > 0) {
            console.log(`  ${r.recordset[0].DocumentNumber} - ${r.recordset[0].StoreName} - Cycle: ${r.recordset[0].Cycle}`);
        } else {
            console.log(`  ${doc} - NOT FOUND`);
        }
    }

    // Update cycle to C1
    const updateResult = await pool.request().query(`
        UPDATE AuditInstances 
        SET Cycle = 'C1' 
        WHERE DocumentNumber IN ('GMRL-FSACSG-1221-0023', 'GMRL-FSACSG-1221-0020')
    `);
    console.log(`\nUpdated ${updateResult.rowsAffected[0]} records`);

    console.log('\nAfter update:');
    for (const doc of docs) {
        const r = await pool.request()
            .input('doc', sql.NVarChar, doc)
            .query('SELECT DocumentNumber, StoreName, Cycle FROM AuditInstances WHERE DocumentNumber = @doc');
        if (r.recordset.length > 0) {
            console.log(`  ${r.recordset[0].DocumentNumber} - ${r.recordset[0].StoreName} - Cycle: ${r.recordset[0].Cycle}`);
        }
    }

    await pool.close();
}

updateCycle().catch(e => console.error('Error:', e.message));
