/**
 * Create StoreSchemas Junction Table and Migrate Data
 * Allows multiple schemas per store
 */

require('dotenv').config();
const sql = require('mssql');

async function createStoreSchemas() {
    const pool = await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: { encrypt: false, trustServerCertificate: true }
    });

    try {
        console.log('🔧 Creating StoreSchemas junction table...\n');

        // Step 1: Check if table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'StoreSchemas'
        `);
        
        if (tableCheck.recordset[0].cnt === 0) {
            // Create the table without foreign key constraints (will add manually if needed)
            await pool.request().query(`
                CREATE TABLE StoreSchemas (
                    StoreSchemaID INT IDENTITY(1,1) PRIMARY KEY,
                    StoreID INT NOT NULL,
                    SchemaID INT NOT NULL,
                    IsDefault BIT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    CreatedBy NVARCHAR(255),
                    CONSTRAINT UQ_StoreSchemas UNIQUE (StoreID, SchemaID)
                )
            `);
            console.log('✅ StoreSchemas table created');
        } else {
            console.log('ℹ️ StoreSchemas table already exists');
        }

        // Step 2: Migrate existing data
        console.log('\n📦 Migrating existing schema assignments...');
        
        const existingData = await pool.request().query(`
            SELECT StoreID, SchemaID, StoreName 
            FROM Stores 
            WHERE SchemaID IS NOT NULL
        `);
        
        let migrated = 0;
        let skipped = 0;
        
        for (const store of existingData.recordset) {
            // Check if already migrated
            const exists = await pool.request()
                .input('StoreID', sql.Int, store.StoreID)
                .input('SchemaID', sql.Int, store.SchemaID)
                .query(`
                    SELECT COUNT(*) as cnt FROM StoreSchemas 
                    WHERE StoreID = @StoreID AND SchemaID = @SchemaID
                `);
            
            if (exists.recordset[0].cnt === 0) {
                await pool.request()
                    .input('StoreID', sql.Int, store.StoreID)
                    .input('SchemaID', sql.Int, store.SchemaID)
                    .query(`
                        INSERT INTO StoreSchemas (StoreID, SchemaID, IsDefault, CreatedBy)
                        VALUES (@StoreID, @SchemaID, 1, 'Migration')
                    `);
                migrated++;
                console.log(`   ✅ ${store.StoreName}`);
            } else {
                skipped++;
            }
        }
        
        console.log(`\n📊 Migration complete: ${migrated} migrated, ${skipped} skipped`);

        // Step 3: Create indexes
        console.log('\n📇 Creating indexes...');
        
        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StoreSchemas_StoreID')
                CREATE INDEX IX_StoreSchemas_StoreID ON StoreSchemas(StoreID)
            `);
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StoreSchemas_SchemaID')
                CREATE INDEX IX_StoreSchemas_SchemaID ON StoreSchemas(SchemaID)
            `);
            console.log('✅ Indexes created');
        } catch (err) {
            console.log('ℹ️ Indexes may already exist');
        }

        // Step 4: Verify
        console.log('\n📋 Verification:');
        const stats = await pool.request().query(`
            SELECT 
                (SELECT COUNT(DISTINCT StoreID) FROM StoreSchemas) as UniqueStores,
                (SELECT COUNT(*) FROM StoreSchemas) as TotalAssignments
        `);
        console.log(`   Unique stores with schemas: ${stats.recordset[0].UniqueStores}`);
        console.log(`   Total store-schema links: ${stats.recordset[0].TotalAssignments}`);

        // Show sample data
        console.log('\n📝 Sample store-schema assignments:');
        const sample = await pool.request().query(`
            SELECT TOP 5 s.StoreName, sc.SchemaName, ss.IsDefault
            FROM StoreSchemas ss
            JOIN Stores s ON ss.StoreID = s.StoreID
            JOIN AuditSchemas sc ON ss.SchemaID = sc.SchemaID
            ORDER BY s.StoreName
        `);
        console.table(sample.recordset);

        console.log('\n✅ StoreSchemas setup complete!');

    } catch (err) {
        console.error('❌ Error:', err.message);
        throw err;
    } finally {
        await pool.close();
    }
}

createStoreSchemas().catch(console.error);
