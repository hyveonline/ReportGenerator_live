const sql = require('mssql');
const config = require('./config/default').database;

async function fixDuplicatePictures() {
    try {
        await sql.connect(config);
        console.log('🔧 Scanning for duplicate pictures in ActionPlanResponses...\n');
        
        // Get all responses with pictures
        const result = await sql.query`
            SELECT ResponseID, DocumentNumber, ReferenceValue, PicturesPaths 
            FROM ActionPlanResponses 
            WHERE PicturesPaths IS NOT NULL 
            AND PicturesPaths != '' 
            AND PicturesPaths != '[]'
        `;
        
        console.log(`Found ${result.recordset.length} responses with pictures\n`);
        
        let fixedCount = 0;
        
        for (const row of result.recordset) {
            try {
                const pics = JSON.parse(row.PicturesPaths);
                
                // Check for duplicates
                const uniquePics = [...new Set(pics)];
                
                if (uniquePics.length !== pics.length) {
                    console.log(`🔧 Fixing duplicates in ResponseID ${row.ResponseID} (${row.DocumentNumber} - ${row.ReferenceValue})`);
                    console.log(`   Before: ${pics.length} pictures, After: ${uniquePics.length} pictures`);
                    
                    // Update with deduplicated pictures
                    const newPicturesJson = JSON.stringify(uniquePics);
                    await sql.query`
                        UPDATE ActionPlanResponses 
                        SET PicturesPaths = ${newPicturesJson}
                        WHERE ResponseID = ${row.ResponseID}
                    `;
                    
                    fixedCount++;
                    console.log('   ✅ Fixed!\n');
                }
            } catch (e) {
                console.log(`⚠️ Error processing ResponseID ${row.ResponseID}:`, e.message);
            }
        }
        
        console.log(`\n✅ Done! Fixed ${fixedCount} records with duplicate pictures.`);
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sql.close();
    }
}

fixDuplicatePictures();
