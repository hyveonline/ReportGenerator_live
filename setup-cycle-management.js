/**
 * Setup Cycle Management Tables
 * LIVE Environment: FoodSafetyDB_Live
 * 
 * Creates:
 * - CycleTypes table
 * - CycleDefinitions table
 * - Inserts default cycle data (Monthly, BiMonthly, Quarterly)
 * - Adds CycleTypeID to AuditSchemas
 */

const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'FoodSafetyDB_Live',
    user: 'sa',
    password: 'Kokowawa123@@',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function setupCycleManagement() {
    let pool;
    
    try {
        console.log('🔌 Connecting to FoodSafetyDB_Live...');
        pool = await sql.connect(config);
        console.log('✅ Connected!\n');

        // Step 1: Create CycleTypes table
        console.log('📋 Step 1: Creating CycleTypes table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CycleTypes')
            BEGIN
                CREATE TABLE CycleTypes (
                    CycleTypeID INT IDENTITY(1,1) PRIMARY KEY,
                    TypeName NVARCHAR(50) NOT NULL,
                    TypeCode NVARCHAR(20) NOT NULL UNIQUE,
                    CyclesPerYear INT NOT NULL,
                    Description NVARCHAR(200),
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    CreatedBy NVARCHAR(100)
                );
                PRINT 'CycleTypes table created';
            END
            ELSE
            BEGIN
                PRINT 'CycleTypes table already exists';
            END
        `);
        console.log('✅ CycleTypes table ready\n');

        // Step 2: Create CycleDefinitions table
        console.log('📋 Step 2: Creating CycleDefinitions table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CycleDefinitions')
            BEGIN
                CREATE TABLE CycleDefinitions (
                    CycleDefID INT IDENTITY(1,1) PRIMARY KEY,
                    CycleTypeID INT NOT NULL,
                    CycleNumber NVARCHAR(10) NOT NULL,
                    CycleName NVARCHAR(50) NOT NULL,
                    StartMonth INT NOT NULL,
                    EndMonth INT NOT NULL,
                    DisplayOrder INT NOT NULL,
                    IsActive BIT DEFAULT 1,
                    CONSTRAINT FK_CycleDefinitions_CycleTypes 
                        FOREIGN KEY (CycleTypeID) REFERENCES CycleTypes(CycleTypeID)
                );
                PRINT 'CycleDefinitions table created';
            END
            ELSE
            BEGIN
                PRINT 'CycleDefinitions table already exists';
            END
        `);
        console.log('✅ CycleDefinitions table ready\n');

        // Step 3: Insert default CycleTypes
        console.log('📋 Step 3: Inserting default cycle types...');
        
        // Check if already has data
        const existingTypes = await pool.request().query('SELECT COUNT(*) as cnt FROM CycleTypes');
        
        if (existingTypes.recordset[0].cnt === 0) {
            await pool.request().query(`
                INSERT INTO CycleTypes (TypeName, TypeCode, CyclesPerYear, Description, CreatedBy)
                VALUES 
                    ('Monthly', 'MONTHLY', 12, 'One audit cycle per month (C1-C12)', 'System'),
                    ('Bi-Monthly', 'BIMONTHLY', 6, 'One audit cycle every two months (C1-C6)', 'System'),
                    ('Quarterly', 'QUARTERLY', 4, 'One audit cycle per quarter (C1-C4)', 'System');
            `);
            console.log('✅ Inserted 3 cycle types: Monthly, Bi-Monthly, Quarterly\n');
        } else {
            console.log('ℹ️ Cycle types already exist, skipping insert\n');
        }

        // Step 4: Insert CycleDefinitions
        console.log('📋 Step 4: Inserting cycle definitions...');
        
        const existingDefs = await pool.request().query('SELECT COUNT(*) as cnt FROM CycleDefinitions');
        
        if (existingDefs.recordset[0].cnt === 0) {
            // Get CycleTypeIDs
            const types = await pool.request().query('SELECT CycleTypeID, TypeCode FROM CycleTypes');
            const typeMap = {};
            types.recordset.forEach(t => typeMap[t.TypeCode] = t.CycleTypeID);

            // Monthly definitions (C1-C12)
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            
            for (let i = 1; i <= 12; i++) {
                await pool.request()
                    .input('typeId', sql.Int, typeMap['MONTHLY'])
                    .input('cycleNum', sql.NVarChar, `C${i}`)
                    .input('cycleName', sql.NVarChar, monthNames[i-1])
                    .input('startMonth', sql.Int, i)
                    .input('endMonth', sql.Int, i)
                    .input('order', sql.Int, i)
                    .query(`
                        INSERT INTO CycleDefinitions (CycleTypeID, CycleNumber, CycleName, StartMonth, EndMonth, DisplayOrder)
                        VALUES (@typeId, @cycleNum, @cycleName, @startMonth, @endMonth, @order)
                    `);
            }
            console.log('  ✅ Monthly: 12 definitions inserted');

            // Bi-Monthly definitions (C1-C6)
            const biMonthlyNames = ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'];
            const biMonthlyRanges = [[1,2], [3,4], [5,6], [7,8], [9,10], [11,12]];
            
            for (let i = 0; i < 6; i++) {
                await pool.request()
                    .input('typeId', sql.Int, typeMap['BIMONTHLY'])
                    .input('cycleNum', sql.NVarChar, `C${i+1}`)
                    .input('cycleName', sql.NVarChar, biMonthlyNames[i])
                    .input('startMonth', sql.Int, biMonthlyRanges[i][0])
                    .input('endMonth', sql.Int, biMonthlyRanges[i][1])
                    .input('order', sql.Int, i+1)
                    .query(`
                        INSERT INTO CycleDefinitions (CycleTypeID, CycleNumber, CycleName, StartMonth, EndMonth, DisplayOrder)
                        VALUES (@typeId, @cycleNum, @cycleName, @startMonth, @endMonth, @order)
                    `);
            }
            console.log('  ✅ Bi-Monthly: 6 definitions inserted');

            // Quarterly definitions (C1-C4)
            const quarterlyNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
            const quarterlyRanges = [[1,3], [4,6], [7,9], [10,12]];
            
            for (let i = 0; i < 4; i++) {
                await pool.request()
                    .input('typeId', sql.Int, typeMap['QUARTERLY'])
                    .input('cycleNum', sql.NVarChar, `C${i+1}`)
                    .input('cycleName', sql.NVarChar, quarterlyNames[i])
                    .input('startMonth', sql.Int, quarterlyRanges[i][0])
                    .input('endMonth', sql.Int, quarterlyRanges[i][1])
                    .input('order', sql.Int, i+1)
                    .query(`
                        INSERT INTO CycleDefinitions (CycleTypeID, CycleNumber, CycleName, StartMonth, EndMonth, DisplayOrder)
                        VALUES (@typeId, @cycleNum, @cycleName, @startMonth, @endMonth, @order)
                    `);
            }
            console.log('  ✅ Quarterly: 4 definitions inserted\n');
        } else {
            console.log('ℹ️ Cycle definitions already exist, skipping insert\n');
        }

        // Step 5: Add CycleTypeID to AuditSchemas
        console.log('📋 Step 5: Adding CycleTypeID to AuditSchemas...');
        
        // Check if column exists
        const columnExists = await pool.request().query(`
            SELECT COUNT(*) as cnt 
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('AuditSchemas') AND name = 'CycleTypeID'
        `);

        if (columnExists.recordset[0].cnt === 0) {
            await pool.request().query(`
                ALTER TABLE AuditSchemas
                ADD CycleTypeID INT NULL;
            `);
            console.log('  ✅ CycleTypeID column added');

            // Add foreign key
            await pool.request().query(`
                ALTER TABLE AuditSchemas
                ADD CONSTRAINT FK_AuditSchemas_CycleTypes
                FOREIGN KEY (CycleTypeID) REFERENCES CycleTypes(CycleTypeID);
            `);
            console.log('  ✅ Foreign key constraint added');

            // Set default value (Monthly) for existing schemas
            const monthlyType = await pool.request().query(`
                SELECT CycleTypeID FROM CycleTypes WHERE TypeCode = 'MONTHLY'
            `);
            
            if (monthlyType.recordset.length > 0) {
                await pool.request()
                    .input('typeId', sql.Int, monthlyType.recordset[0].CycleTypeID)
                    .query(`
                        UPDATE AuditSchemas 
                        SET CycleTypeID = @typeId 
                        WHERE CycleTypeID IS NULL
                    `);
                console.log('  ✅ Existing schemas set to Monthly (default)\n');
            }
        } else {
            console.log('ℹ️ CycleTypeID column already exists\n');
        }

        // Summary
        console.log('═══════════════════════════════════════════════');
        console.log('                  SUMMARY                       ');
        console.log('═══════════════════════════════════════════════');
        
        const typesCount = await pool.request().query('SELECT COUNT(*) as cnt FROM CycleTypes');
        const defsCount = await pool.request().query('SELECT COUNT(*) as cnt FROM CycleDefinitions');
        const schemasCount = await pool.request().query('SELECT COUNT(*) as cnt FROM AuditSchemas WHERE CycleTypeID IS NOT NULL');
        
        console.log(`📊 Cycle Types: ${typesCount.recordset[0].cnt}`);
        console.log(`📊 Cycle Definitions: ${defsCount.recordset[0].cnt}`);
        console.log(`📊 Schemas with CycleTypeID: ${schemasCount.recordset[0].cnt}`);
        
        // Show all types with their definitions count
        const summary = await pool.request().query(`
            SELECT ct.TypeName, ct.CyclesPerYear, COUNT(cd.CycleDefID) as DefinitionsCount
            FROM CycleTypes ct
            LEFT JOIN CycleDefinitions cd ON ct.CycleTypeID = cd.CycleTypeID
            GROUP BY ct.TypeName, ct.CyclesPerYear
            ORDER BY ct.CyclesPerYear DESC
        `);
        
        console.log('\n📋 Cycle Types:');
        summary.recordset.forEach(t => {
            console.log(`   • ${t.TypeName}: ${t.DefinitionsCount} definitions (${t.CyclesPerYear} per year)`);
        });

        console.log('\n✅ Cycle Management setup complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run setup
setupCycleManagement();
