/**
 * Add Bi-Weekly cycle definitions
 * Bi-Weekly has 24 cycles per year (every 2 weeks)
 */
const sql = require('mssql');
require('dotenv').config();

async function addBiWeeklyCycleDefinitions() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    try {
        // Get the Bi-Weekly cycle type ID
        const cycleType = await pool.request().query(`
            SELECT CycleTypeID, TypeName, CyclesPerYear FROM CycleTypes WHERE TypeCode = 'BI-WEEKLY'
        `);

        if (cycleType.recordset.length === 0) {
            console.log('❌ Bi-Weekly cycle type not found!');
            return;
        }

        const biWeeklyId = cycleType.recordset[0].CycleTypeID;
        console.log(`Found Bi-Weekly type: ID=${biWeeklyId}, CyclesPerYear=${cycleType.recordset[0].CyclesPerYear}`);

        // Check if definitions already exist
        const existing = await pool.request()
            .input('typeId', sql.Int, biWeeklyId)
            .query(`SELECT COUNT(*) as count FROM CycleDefinitions WHERE CycleTypeID = @typeId`);

        if (existing.recordset[0].count > 0) {
            console.log(`⚠️  Bi-Weekly already has ${existing.recordset[0].count} definitions. Deleting and recreating...`);
            await pool.request()
                .input('typeId', sql.Int, biWeeklyId)
                .query(`DELETE FROM CycleDefinitions WHERE CycleTypeID = @typeId`);
        }

        // Bi-Weekly: 24 cycles per year
        // Each cycle covers approximately 2 weeks
        // We'll define them based on approximate date ranges
        const biWeeklyCycles = [
            { num: 'C1',  name: 'Week 1-2 (Jan)',    startMonth: 1,  endMonth: 1 },
            { num: 'C2',  name: 'Week 3-4 (Jan)',    startMonth: 1,  endMonth: 1 },
            { num: 'C3',  name: 'Week 5-6 (Feb)',    startMonth: 2,  endMonth: 2 },
            { num: 'C4',  name: 'Week 7-8 (Feb)',    startMonth: 2,  endMonth: 2 },
            { num: 'C5',  name: 'Week 9-10 (Mar)',   startMonth: 3,  endMonth: 3 },
            { num: 'C6',  name: 'Week 11-12 (Mar)',  startMonth: 3,  endMonth: 3 },
            { num: 'C7',  name: 'Week 13-14 (Apr)',  startMonth: 4,  endMonth: 4 },
            { num: 'C8',  name: 'Week 15-16 (Apr)',  startMonth: 4,  endMonth: 4 },
            { num: 'C9',  name: 'Week 17-18 (May)',  startMonth: 5,  endMonth: 5 },
            { num: 'C10', name: 'Week 19-20 (May)',  startMonth: 5,  endMonth: 5 },
            { num: 'C11', name: 'Week 21-22 (Jun)',  startMonth: 6,  endMonth: 6 },
            { num: 'C12', name: 'Week 23-24 (Jun)',  startMonth: 6,  endMonth: 6 },
            { num: 'C13', name: 'Week 25-26 (Jul)',  startMonth: 7,  endMonth: 7 },
            { num: 'C14', name: 'Week 27-28 (Jul)',  startMonth: 7,  endMonth: 7 },
            { num: 'C15', name: 'Week 29-30 (Aug)',  startMonth: 8,  endMonth: 8 },
            { num: 'C16', name: 'Week 31-32 (Aug)',  startMonth: 8,  endMonth: 8 },
            { num: 'C17', name: 'Week 33-34 (Sep)',  startMonth: 9,  endMonth: 9 },
            { num: 'C18', name: 'Week 35-36 (Sep)',  startMonth: 9,  endMonth: 9 },
            { num: 'C19', name: 'Week 37-38 (Oct)',  startMonth: 10, endMonth: 10 },
            { num: 'C20', name: 'Week 39-40 (Oct)',  startMonth: 10, endMonth: 10 },
            { num: 'C21', name: 'Week 41-42 (Nov)',  startMonth: 11, endMonth: 11 },
            { num: 'C22', name: 'Week 43-44 (Nov)',  startMonth: 11, endMonth: 11 },
            { num: 'C23', name: 'Week 45-46 (Dec)',  startMonth: 12, endMonth: 12 },
            { num: 'C24', name: 'Week 47-48 (Dec)',  startMonth: 12, endMonth: 12 }
        ];

        console.log('\nAdding Bi-Weekly cycle definitions...');
        
        for (let i = 0; i < biWeeklyCycles.length; i++) {
            const cycle = biWeeklyCycles[i];
            await pool.request()
                .input('typeId', sql.Int, biWeeklyId)
                .input('cycleNumber', sql.NVarChar, cycle.num)
                .input('cycleName', sql.NVarChar, cycle.name)
                .input('startMonth', sql.Int, cycle.startMonth)
                .input('endMonth', sql.Int, cycle.endMonth)
                .input('displayOrder', sql.Int, i + 1)
                .query(`
                    INSERT INTO CycleDefinitions (CycleTypeID, CycleNumber, CycleName, StartMonth, EndMonth, DisplayOrder)
                    VALUES (@typeId, @cycleNumber, @cycleName, @startMonth, @endMonth, @displayOrder)
                `);
            console.log(`  ✅ Added ${cycle.num}: ${cycle.name}`);
        }

        console.log('\n✅ Successfully added 24 Bi-Weekly cycle definitions!');

        // Verify
        const verify = await pool.request()
            .input('typeId', sql.Int, biWeeklyId)
            .query(`
                SELECT CycleNumber, CycleName, StartMonth, EndMonth 
                FROM CycleDefinitions 
                WHERE CycleTypeID = @typeId 
                ORDER BY DisplayOrder
            `);
        
        console.log('\nVerification - Bi-Weekly Cycles:');
        verify.recordset.forEach(c => {
            console.log(`  ${c.CycleNumber}: ${c.CycleName} (Month ${c.StartMonth}-${c.EndMonth})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.close();
    }
}

addBiWeeklyCycleDefinitions();
