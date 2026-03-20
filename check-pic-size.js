const sql = require('mssql');
const config = require('./config/default').database;

async function checkPictureSizes() {
    await sql.connect(config);
    
    const result = await sql.query`
        SELECT ResponseID, ReferenceValue, LEN(PicturesPaths) as PicSize 
        FROM ActionPlanResponses 
        WHERE DocumentNumber = 'GMRL-FSACSG-1221-0023' 
        AND PicturesPaths IS NOT NULL 
        AND PicturesPaths != '[]'
        ORDER BY LEN(PicturesPaths) DESC
    `;
    
    console.log('Picture data sizes for audit 68:');
    let total = 0;
    result.recordset.forEach(r => {
        if (r.PicSize > 0) {
            console.log(`${r.ReferenceValue}: ${Math.round(r.PicSize/1024)} KB`);
            total += r.PicSize;
        }
    });
    console.log('');
    console.log(`Total picture data: ${Math.round(total/1024/1024)} MB`);
    
    await sql.close();
}

checkPictureSizes().catch(e => console.error(e));
