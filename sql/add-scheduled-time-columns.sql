-- Add scheduled time columns to ActionPlanEscalationSettings
-- This allows configuring when emails are sent

USE FoodSafetyDB_Live;
GO

-- Add ScheduledRunTime column (time of day to run the job)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ActionPlanEscalationSettings') AND name = 'ScheduledRunTime')
BEGIN
    ALTER TABLE ActionPlanEscalationSettings
    ADD ScheduledRunTime TIME DEFAULT '09:00:00';
    
    PRINT 'Added ScheduledRunTime column (default: 09:00 AM)';
END
GO

-- Add RunOnWeekendsEnabled column (whether to run on Sat/Sun)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ActionPlanEscalationSettings') AND name = 'RunOnWeekendsEnabled')
BEGIN
    ALTER TABLE ActionPlanEscalationSettings
    ADD RunOnWeekendsEnabled BIT DEFAULT 0;
    
    PRINT 'Added RunOnWeekendsEnabled column (default: No - only Mon-Fri)';
END
GO

-- Update existing row with defaults
UPDATE ActionPlanEscalationSettings
SET ScheduledRunTime = '09:00:00',
    RunOnWeekendsEnabled = 0
WHERE ScheduledRunTime IS NULL;

PRINT 'Updated existing settings with defaults';
PRINT '';
PRINT 'Escalation job will now run at 09:00 AM on weekdays only by default.';
GO
