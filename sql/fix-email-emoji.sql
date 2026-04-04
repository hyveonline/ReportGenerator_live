-- Fix corrupted emoji icons in email templates
-- Using HTML entity codes to avoid encoding issues

-- Fix Action Plan Escalation template
UPDATE EmailTemplates 
SET html_body = N'<div style="font-family: Segoe UI, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">&#128680; Action Plan Escalation</h1>
    </div>
    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Dear {{recipientName}},</p>
        <p>This is an escalation notice. The following <strong>Action Plan</strong> has <strong style="color: #dc2626;">exceeded its deadline</strong> and requires your attention:</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Store:</strong> {{storeName}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Document:</strong> {{documentNumber}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Audit Date:</strong> {{auditDate}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Report Sent On:</strong> {{reportSentDate}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Action Plan Submission Deadline:</strong> {{deadline}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Action Plan Submission Overdue:</strong> <span style="color: #dc2626; font-weight: bold;">{{daysOverdue}} business day(s)</span></p>
            <p style="margin: 8px 0 0 0;"><strong>Store Manager:</strong> {{storeManagerName}}</p>
        </div>
        <p>Please follow up with the Store Manager to ensure the action plan is completed as soon as possible.</p>
        <p style="text-align: center; margin-top: 30px;">
            <a href="{{actionPlanUrl}}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Action Plan</a>
        </p>
    </div>
</div>'
WHERE template_key = 'action_plan_escalation';

-- Fix Action Plan Overdue template
UPDATE EmailTemplates 
SET html_body = N'<div style="font-family: Segoe UI, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">&#9888; Action Plan Overdue</h1>
    </div>
    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Dear {{recipientName}},</p>
        <p>Your <strong>Action Plan</strong> for the following audit is now <strong style="color: #dc2626;">overdue</strong>:</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Store:</strong> {{storeName}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Document:</strong> {{documentNumber}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Audit Date:</strong> {{auditDate}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Report Sent On:</strong> {{reportSentDate}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Action Plan Submission Deadline:</strong> {{deadline}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Action Plan Submission Overdue:</strong> <span style="color: #dc2626; font-weight: bold;">{{daysOverdue}} business day(s)</span></p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">This matter has been escalated to your Area Manager.</p>
        <p>Please complete the action plan immediately.</p>
        <p style="text-align: center; margin-top: 30px;">
            <a href="{{actionPlanUrl}}" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Action Plan Now</a>
        </p>
    </div>
</div>'
WHERE template_key = 'action_plan_overdue';

-- Fix Action Plan Reminder template
UPDATE EmailTemplates 
SET html_body = N'<div style="font-family: Segoe UI, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">&#9200; Action Plan Reminder</h1>
    </div>
    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Dear {{recipientName}},</p>
        <p>This is a friendly reminder that your <strong>Action Plan</strong> deadline is approaching:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Store:</strong> {{storeName}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Document:</strong> {{documentNumber}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Audit Date:</strong> {{auditDate}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Report Sent On:</strong> {{reportSentDate}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Action Plan Submission Deadline:</strong> {{deadline}}</p>
            <p style="margin: 8px 0 0 0;"><strong>Days Remaining:</strong> <span style="color: #d97706; font-weight: bold;">{{daysRemaining}} business day(s)</span></p>
        </div>
        <p>Please ensure your action plan is completed before the deadline to avoid escalation.</p>
        <p style="text-align: center; margin-top: 30px;">
            <a href="{{actionPlanUrl}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Action Plan</a>
        </p>
    </div>
</div>'
WHERE template_key = 'action_plan_reminder';

PRINT 'Fixed emoji icons in email templates';
