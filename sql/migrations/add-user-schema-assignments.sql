-- =============================================
-- Migration: Add UserSchemaAssignments table
-- Allows assigning checklists (schemas) to HeadOfOperations and AreaManager users
-- Run this script on both FoodSafetyDB and FoodSafetyDB_Live
-- Date: 2026-04-14
-- =============================================

USE FoodSafetyDB;
GO

-- =============================================
-- 1. Create UserSchemaAssignments table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSchemaAssignments')
BEGIN
    CREATE TABLE UserSchemaAssignments (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        SchemaID INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CreatedBy NVARCHAR(255) NULL,
        CONSTRAINT UQ_UserSchemaAssignment UNIQUE (UserID, SchemaID)
    );
    PRINT '✅ Created UserSchemaAssignments table';
END
ELSE
BEGIN
    PRINT '✓ UserSchemaAssignments table already exists';
END
GO

PRINT '';
PRINT '=============================================';
PRINT '  Migration complete!';
PRINT '=============================================';
