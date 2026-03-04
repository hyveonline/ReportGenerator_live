/**
 * Test script to preview Report View Notification and Action Plan Submitted to Area Manager email
 * Run: node test-report-view-notification.js
 */

const sql = require('mssql');
const fs = require('fs');

const dbConfig = {
    server: 'localhost',
    database: 'FoodSafetyDB_Live',
    user: 'sa',
    password: 'Kokowawa123@@',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testReportViewNotification() {
    const pool = await sql.connect(dbConfig);
    
    console.log('\n=== REPORT VIEW NOTIFICATION TEST ===\n');
    
    // 1. Get a sample audit to test with
    const auditResult = await pool.request().query(`
        SELECT TOP 1 ai.AuditID, ai.DocumentNumber, ai.StoreName, ai.AuditDate, ai.TotalScore, ai.CreatedBy,
               u.id as CreatorId, u.email as CreatorEmail, u.display_name as CreatorName
        FROM AuditInstances ai
        LEFT JOIN Users u ON u.email = ai.CreatedBy
        WHERE ai.Status = 'Completed'
        ORDER BY ai.AuditID DESC
    `);
    
    if (auditResult.recordset.length === 0) {
        console.log('❌ No completed audits found for testing');
        await pool.close();
        return;
    }
    
    const audit = auditResult.recordset[0];
    console.log('📋 Sample Audit:');
    console.log(`   Audit ID: ${audit.AuditID}`);
    console.log(`   Document: ${audit.DocumentNumber}`);
    console.log(`   Store: ${audit.StoreName}`);
    console.log(`   Score: ${audit.TotalScore ? Math.round(audit.TotalScore) + '%' : 'N/A'}`);
    console.log(`   Created By: ${audit.CreatedBy}`);
    console.log('');
    
    // 2. Get SuperAuditors (except Danielle Melhem)
    const superAuditorsResult = await pool.request().query(`
        SELECT id, email, display_name 
        FROM Users 
        WHERE role = 'SuperAuditor' 
        AND is_active = 1 
        AND email IS NOT NULL
        AND email != 'Danielle.Melhem@gmrlgroup.com'
    `);
    
    console.log('👥 Report View Recipients (Auditor + SuperAuditors except Danielle):');
    
    // Add audit creator
    const recipients = [];
    if (audit.CreatorEmail) {
        recipients.push({
            email: audit.CreatorEmail,
            name: audit.CreatorName || audit.CreatorEmail,
            role: 'AuditCreator'
        });
        console.log(`   ✓ ${audit.CreatorName || audit.CreatorEmail} (${audit.CreatorEmail}) - Audit Creator`);
    }
    
    // Add SuperAuditors
    for (const sa of superAuditorsResult.recordset) {
        if (!recipients.find(r => r.email.toLowerCase() === sa.email.toLowerCase())) {
            recipients.push({
                email: sa.email,
                name: sa.display_name || sa.email,
                role: 'SuperAuditor'
            });
            console.log(`   ✓ ${sa.display_name || sa.email} (${sa.email}) - SuperAuditor`);
        }
    }
    
    console.log(`\n   Total recipients: ${recipients.length}`);
    console.log('');
    
    // 3. Get Area Managers for Action Plan notification
    console.log('👥 Action Plan Submitted Recipients (Area Managers for this store):');
    
    const areaManagersResult = await pool.request()
        .input('storeName', sql.NVarChar(255), audit.StoreName)
        .query(`
            SELECT DISTINCT u.id, u.email, u.display_name 
            FROM Users u
            WHERE u.role = 'AreaManager' 
            AND u.is_active = 1 
            AND u.email IS NOT NULL
            AND (
                u.assigned_stores LIKE '%' + @storeName + '%'
                OR EXISTS (
                    SELECT 1 FROM StoreManagerAssignments sma 
                    INNER JOIN Stores s ON s.StoreID = sma.StoreID
                    WHERE sma.UserID = u.id 
                    AND s.StoreName = @storeName
                )
            )
        `);
    
    if (areaManagersResult.recordset.length === 0) {
        console.log(`   ⚠️  No Area Managers assigned to store: ${audit.StoreName}`);
    } else {
        for (const am of areaManagersResult.recordset) {
            console.log(`   ✓ ${am.display_name || am.email} (${am.email}) - AreaManager`);
        }
        console.log(`\n   Total Area Managers: ${areaManagersResult.recordset.length}`);
    }
    console.log('');
    
    // 4. Check system sender session
    console.log('📧 System Sender Status:');
    const systemSenderEmail = 'spnotification@spinneys-lebanon.com';
    
    const senderResult = await pool.request()
        .input('email', sql.NVarChar, systemSenderEmail)
        .query(`
            SELECT TOP 1 
                s.expires_at, 
                s.created_at,
                u.email,
                u.display_name,
                CASE WHEN s.azure_access_token IS NOT NULL THEN 1 ELSE 0 END as hasAccessToken,
                CASE WHEN s.azure_refresh_token IS NOT NULL THEN 1 ELSE 0 END as hasRefreshToken
            FROM Sessions s
            INNER JOIN Users u ON s.user_id = u.id
            WHERE u.email = @email
            ORDER BY s.created_at DESC
        `);
    
    if (senderResult.recordset.length === 0) {
        console.log(`   ❌ NO SESSION for ${systemSenderEmail}`);
        console.log(`   ⚠️  Please login with this account to enable automated notifications`);
    } else {
        const session = senderResult.recordset[0];
        const isExpired = new Date(session.expires_at) < new Date();
        console.log(`   Email: ${session.email}`);
        console.log(`   Name: ${session.display_name}`);
        console.log(`   Expires: ${session.expires_at}`);
        console.log(`   Has Access Token: ${session.hasAccessToken ? '✓ Yes' : '✗ No'}`);
        console.log(`   Has Refresh Token: ${session.hasRefreshToken ? '✓ Yes' : '✗ No'}`);
        console.log(`   Session Status: ${isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`);
    }
    console.log('');
    
    // 5. Generate email previews
    const viewerName = 'John Smith (Test)';
    const viewerRole = 'StoreManager';
    const submittedAt = new Date().toLocaleString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
    const auditDate = audit.AuditDate ? new Date(audit.AuditDate).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    }) : 'N/A';
    const score = audit.TotalScore ? Math.round(audit.TotalScore) + '%' : 'N/A';
    
    // Email 1: Report View Notification
    console.log('📄 EMAIL 1: REPORT VIEW NOTIFICATION');
    console.log('─'.repeat(60));
    console.log(`Subject: 📋 Report Viewed: ${audit.StoreName} (${audit.DocumentNumber})`);
    console.log(`To: ${recipients.map(r => r.email).join(', ')}`);
    console.log(`From: ${systemSenderEmail}`);
    console.log('─'.repeat(60));
    
    // Email 2: Action Plan Submitted to Area Manager
    console.log('\n📄 EMAIL 2: ACTION PLAN SUBMITTED TO AREA MANAGER');
    console.log('─'.repeat(60));
    console.log(`Subject: 📝 Action Plan Submitted - ${audit.StoreName} (${audit.DocumentNumber})`);
    console.log(`To: ${areaManagersResult.recordset.map(r => r.email).join(', ') || 'No Area Managers found'}`);
    console.log(`From: ${systemSenderEmail}`);
    console.log('─'.repeat(60));
    
    // Save HTML previews
    const htmlEmail1 = generateReportViewEmail(audit, viewerName, viewerRole, submittedAt, auditDate, score);
    const htmlEmail2 = generateActionPlanSubmittedEmail(audit, viewerName, viewerRole, submittedAt, auditDate, score);
    
    fs.writeFileSync('./test-email-preview.html', htmlEmail1);
    fs.writeFileSync('./test-email-preview-action-plan.html', htmlEmail2);
    
    console.log(`\n✅ HTML email previews saved:`);
    console.log(`   1. ./test-email-preview.html (Report View)`);
    console.log(`   2. ./test-email-preview-action-plan.html (Action Plan Submitted)\n`);
    
    await pool.close();
}

function generateReportViewEmail(audit, viewerName, viewerRole, viewedAt, auditDate, score) {
    return `
<!DOCTYPE html>
<html>
<head><title>Report View Notification Preview</title></head>
<body style="margin: 0; padding: 20px; background: #f3f4f6;">
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📋 Report Viewed Notification</h2>
    </div>
    <div style="padding: 25px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <strong style="color: #1e40af;">👤 ${viewerName}</strong>
            <span style="color: #1e40af;"> (${viewerRole})</span>
            <p style="margin: 8px 0 0 0; color: #1e3a8a;">has viewed the audit report.</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6; width: 35%;"><strong>🏪 Store</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${audit.StoreName}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>📋 Document #</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${audit.DocumentNumber}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>📅 Audit Date</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${auditDate}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>🎯 Score</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${score}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>🕐 Viewed At</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${viewedAt}</td>
            </tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="https://fsaudit.gmrlapps.com/api/audits/reports/Audit_Report_${audit.DocumentNumber}.html" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Report
            </a>
        </p>
    </div>
    <div style="background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
        Food Safety Audit System - Automated Notification
    </div>
</div>
</body>
</html>
`;
}

function generateActionPlanSubmittedEmail(audit, submitterName, submitterRole, submittedAt, auditDate, score) {
    return `
<!DOCTYPE html>
<html>
<head><title>Action Plan Submitted Preview</title></head>
<body style="margin: 0; padding: 20px; background: #f3f4f6;">
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📝 Action Plan Submitted</h2>
    </div>
    <div style="padding: 25px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <strong style="color: #065f46;">👤 ${submitterName}</strong>
            <span style="color: #065f46;"> (${submitterRole})</span>
            <p style="margin: 8px 0 0 0; color: #047857;">has submitted the action plan for your review.</p>
        </div>
        
        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
            <strong style="color: #b45309; font-size: 1.1em;">⚠️ Please confirm that you have reviewed the action plan</strong>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6; width: 35%;"><strong>🏪 Store</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${audit.StoreName}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>📋 Document #</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${audit.DocumentNumber}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>📅 Audit Date</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${auditDate}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>🎯 Score</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${score}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f3f4f6;"><strong>🕐 Submitted At</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${submittedAt}</td>
            </tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="https://fsaudit.gmrlapps.com/auditor/action-plan?doc=${encodeURIComponent(audit.DocumentNumber)}" 
               style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Review Action Plan
            </a>
        </p>
    </div>
    <div style="background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
        Food Safety Audit System - Automated Notification
    </div>
</div>
</body>
</html>
`;
}

testReportViewNotification().catch(console.error);
