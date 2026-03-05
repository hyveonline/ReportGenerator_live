-- Migration: Add Re-audit columns to AuditInstances
-- Date: 2026-03-05
-- Description: Adds columns to support re-audit functionality
-- SAFE: Only ADD columns with defaults, no data modification

-- Check if columns exist before adding (safe for re-runs)

-- 1. IsReaudit - Flag to identify re-audits
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'AuditInstances' AND COLUMN_NAME = 'IsReaudit')
BEGIN
    ALTER TABLE AuditInstances ADD IsReaudit BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsReaudit column';
END
ELSE
    PRINT 'IsReaudit column already exists';
GO

-- 2. OriginalAuditID - Foreign key to the original audit (NULL for normal audits)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'AuditInstances' AND COLUMN_NAME = 'OriginalAuditID')
BEGIN
    ALTER TABLE AuditInstances ADD OriginalAuditID INT NULL;
    PRINT 'Added OriginalAuditID column';
END
ELSE
    PRINT 'OriginalAuditID column already exists';
GO

-- 3. ReauditNumber - Sequential number for multiple re-audits (1, 2, 3...)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'AuditInstances' AND COLUMN_NAME = 'ReauditNumber')
BEGIN
    ALTER TABLE AuditInstances ADD ReauditNumber INT NULL;
    PRINT 'Added ReauditNumber column';
END
ELSE
    PRINT 'ReauditNumber column already exists';
GO

-- 4. Add foreign key constraint (optional, for referential integrity)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
               WHERE CONSTRAINT_NAME = 'FK_AuditInstances_OriginalAudit')
BEGIN
    ALTER TABLE AuditInstances 
    ADD CONSTRAINT FK_AuditInstances_OriginalAudit 
    FOREIGN KEY (OriginalAuditID) REFERENCES AuditInstances(AuditID);
    PRINT 'Added FK constraint for OriginalAuditID';
END
ELSE
    PRINT 'FK constraint already exists';
GO

-- Verification query
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'AuditInstances' 
  AND COLUMN_NAME IN ('IsReaudit', 'OriginalAuditID', 'ReauditNumber')
ORDER BY COLUMN_NAME;
GO

PRINT 'Migration completed successfully';
