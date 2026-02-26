-- Fix emoji encoding in Report Notification template
-- Uses HTML entities for emoji compatibility across all email clients

UPDATE EmailTemplates
SET 
    subject_template = '{{statusEmoji}} Food Safety Audit Report - {{storeName}} ({{documentNumber}})',
    html_body = N'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .highlight { background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>&#127869; Food Safety Audit Report</h1>
        </div>
        <div class="content">
            <p>Dear {{recipientName}},</p>
            
            <p>The Food Safety Report for your store has been successfully submitted and is now available on the online dashboard.</p>
            
            <div class="highlight">
                <strong>&#128203; Store:</strong> {{storeName}}<br>
                <strong>&#128196; Document:</strong> {{documentNumber}}<br>
                <strong>&#128197; Date:</strong> {{auditDate}}<br>
                <strong>&#128202; Score:</strong> <span style="color: {{scoreColor}}; font-weight: bold;">{{score}}</span><br>
                <strong>&#128203; Status:</strong> <span style="display: inline-block; background: {{statusBgColor}}; color: {{statusColor}}; padding: 4px 12px; border-radius: 4px; font-weight: bold;">{{statusEmoji}} {{statusText}}</span>
            </div>
            
            <p>You can access the report via the following link:</p>
            
            <p style="text-align: center;">
                <a href="{{reportUrl}}" class="button">&#128196; View Report</a>
            </p>
            
            <p><strong>&#9888;&#65039; Please review the report and ensure filling the action plan along with accompanying photos within one week.</strong></p>
            
            <p>If you have any questions, don''t hesitate to contact the food safety team.</p>
            
            <p>Thank you.</p>
        </div>
        <div class="footer">
            <p>Food Safety Audit System | GMRL Group</p>
        </div>
    </div>
</body>
</html>',
    updated_at = GETDATE()
WHERE template_key = 'report_notification';

-- Verify the update
SELECT template_key, template_name, LEFT(html_body, 200) as html_preview
FROM EmailTemplates 
WHERE template_key = 'report_notification';

PRINT 'Report Notification template updated with HTML entity emojis';
