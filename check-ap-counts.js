const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    const pool = await sql.connect(config);
    
    // Check actual cycles from API (what dropdown shows)
    const cycles = await pool.request().query(`
        SELECT DISTINCT Cycle as name 
        FROM AuditInstances 
        WHERE Cycle IS NOT NULL AND Cycle != '' AND Status = 'Completed'
        ORDER BY name
    `);
    console.log('Cycles from API (dropdown values):');
    console.log(cycles.recordset.map(r => r.name));
    
    // Check ALL action plan counts per cycle in 2026
    const allCycles = await pool.request().query(`
        SELECT ai.Cycle, 
            COUNT(*) as Total,
            SUM(CASE WHEN apr.Status = 'Completed' THEN 1 ELSE 0 END) as Solved,
            SUM(CASE WHEN apr.Status != 'Completed' OR apr.Status IS NULL THEN 1 ELSE 0 END) as Unsolved
        FROM ActionPlanResponses apr 
        INNER JOIN AuditInstances ai ON apr.DocumentNumber = ai.DocumentNumber
        LEFT JOIN Stores s ON ai.StoreID = s.StoreID
        WHERE ai.Status = 'Completed'
        AND ai.Year = 2026
        GROUP BY ai.Cycle
        ORDER BY ai.Cycle
    `);
    console.log('\n2026 Action Plans by Cycle:');
    console.table(allCycles.recordset);
    
    // Calculate totals for C3+
    const c3Plus = allCycles.recordset.filter(r => {
        const match = r.Cycle.match(/C(\d+)/i);
        return match && parseInt(match[1]) >= 3;
    });
    console.log('\nC3+ totals:');
    const totals = c3Plus.reduce((acc, r) => {
        acc.Total += r.Total;
        acc.Solved += r.Solved;
        acc.Unsolved += r.Unsolved;
        return acc;
    }, { Total: 0, Solved: 0, Unsolved: 0 });
    console.log(totals);
    
    // Debug: Check if there's any item with NULL cycle or empty cycle
    const nullCycle = await pool.request().query(`
        SELECT COUNT(*) as cnt
        FROM ActionPlanResponses apr 
        INNER JOIN AuditInstances ai ON apr.DocumentNumber = ai.DocumentNumber
        WHERE ai.Status = 'Completed'
        AND ai.Year = 2026
        AND (ai.Cycle IS NULL OR ai.Cycle = '')
    `);
    console.log('\nAction plans with NULL/empty cycle:', nullCycle.recordset[0].cnt);
    
    pool.close();
}
check().catch(console.error);
