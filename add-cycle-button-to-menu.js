/**
 * Add Cycle Management button to MenuPermissions table
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

async function addCycleButton() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Check if it already exists
        const existsCheck = await sql.query`
            SELECT * FROM MenuPermissions WHERE ButtonID = 'cycleManagementBtn'
        `;
        
        if (existsCheck.recordset.length > 0) {
            console.log('⚠️ Button already exists:', existsCheck.recordset[0]);
            await sql.close();
            return;
        }

        // Get the next sort order for System Administration category
        const sortOrderResult = await sql.query`
            SELECT ISNULL(MAX(SortOrder), 0) + 1 as NextSortOrder 
            FROM MenuPermissions 
            WHERE Category = 'System Administration'
        `;
        const nextSortOrder = sortOrderResult.recordset[0].NextSortOrder;

        // Insert the button
        const result = await sql.query`
            INSERT INTO MenuPermissions 
            (ButtonID, ButtonName, Category, Icon, Url, ActionType, AllowedRoles, IsEnabled, SortOrder, CreatedAt, EditRoles)
            VALUES 
            ('cycleManagementBtn', 'Cycle Management', 'System Administration', 'refresh', '/admin/cycle-management', 'navigate', 'Admin,SuperAuditor', 1, ${nextSortOrder}, GETDATE(), 'Admin')
        `;
        
        console.log('✅ Button inserted (rows affected:', result.rowsAffected[0], ')');

        // Verify the button exists
        const verifyResult = await sql.query`
            SELECT * FROM MenuPermissions WHERE ButtonID = 'cycleManagementBtn'
        `;
        console.log('📋 Button record:', verifyResult.recordset[0]);

        await sql.close();
        console.log('\n✅ Done! Cycle Management button added to menu.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addCycleButton();
