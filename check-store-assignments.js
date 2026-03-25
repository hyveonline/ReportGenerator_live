const sql = require('mssql');
const config = require('./config/default').database;

async function check() {
    const pool = await sql.connect(config);
    
    // Check UserBrandAssignments for HeadOfOperations
    const brandAssignments = await pool.request().query(`
        SELECT uba.*, u.email, u.display_name, u.role
        FROM UserBrandAssignments uba
        INNER JOIN Users u ON uba.UserID = u.id
        WHERE u.role = 'HeadOfOperations'
        ORDER BY uba.Brand, u.display_name
    `);
    console.log('=== HeadOfOperations Brand Assignments ===');
    console.table(brandAssignments.recordset);
    
    // Check what brand Spinneys Tripoli belongs to
    const storeInfo = await pool.request()
        .input('StoreID', sql.Int, 17)
        .query(`SELECT StoreID, StoreName, Brand FROM Stores WHERE StoreID = @StoreID`);
    console.log('\n=== Spinneys Tripoli Store Info ===');
    console.log(storeInfo.recordset[0]);
    
    // Get the brand
    if (storeInfo.recordset.length > 0) {
        const brand = storeInfo.recordset[0].Brand;
        console.log(`\nBrand: ${brand}`);
        
        // Find all HOs assigned to this brand
        const hosForBrand = await pool.request()
            .input('Brand', sql.NVarChar(100), brand)
            .query(`
                SELECT u.email, u.display_name, u.role
                FROM UserBrandAssignments uba
                INNER JOIN Users u ON uba.UserID = u.id
                WHERE uba.Brand = @Brand AND u.role = 'HeadOfOperations'
            `);
        console.log(`\n=== HeadOfOperations assigned to brand "${brand}" ===`);
        console.table(hosForBrand.recordset);
    }
    
    process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
