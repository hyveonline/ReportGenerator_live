-- ============================================================
-- StoreSchemas Junction Table - Multiple Schemas per Store
-- Run this on FoodSafetyDB_Live
-- ============================================================

-- Step 1: Create the junction table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StoreSchemas')
BEGIN
    CREATE TABLE StoreSchemas (
        StoreSchemaID INT IDENTITY(1,1) PRIMARY KEY,
        StoreID INT NOT NULL,
        SchemaID INT NOT NULL,
        IsDefault BIT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        CreatedBy NVARCHAR(255),
        CONSTRAINT FK_StoreSchemas_Stores FOREIGN KEY (StoreID) REFERENCES Stores(StoreID) ON DELETE CASCADE,
        CONSTRAINT FK_StoreSchemas_Schemas FOREIGN KEY (SchemaID) REFERENCES AuditSchemas(SchemaID) ON DELETE CASCADE,
        CONSTRAINT UQ_StoreSchemas UNIQUE (StoreID, SchemaID)
    );
    
    PRINT 'StoreSchemas table created successfully';
END
ELSE
BEGIN
    PRINT 'StoreSchemas table already exists';
END
GO

-- Step 2: Migrate existing SchemaID data from Stores table
-- This copies existing assignments to the new junction table
INSERT INTO StoreSchemas (StoreID, SchemaID, IsDefault, CreatedAt, CreatedBy)
SELECT StoreID, SchemaID, 1, GETDATE(), 'Migration'
FROM Stores 
WHERE SchemaID IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM StoreSchemas ss 
    WHERE ss.StoreID = Stores.StoreID AND ss.SchemaID = Stores.SchemaID
);

PRINT 'Migrated existing schema assignments';
GO

-- Step 3: Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StoreSchemas_StoreID')
BEGIN
    CREATE INDEX IX_StoreSchemas_StoreID ON StoreSchemas(StoreID);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StoreSchemas_SchemaID')
BEGIN
    CREATE INDEX IX_StoreSchemas_SchemaID ON StoreSchemas(SchemaID);
END
GO

-- Verify migration
SELECT 'Total stores with schemas' as Info, COUNT(DISTINCT StoreID) as Count FROM StoreSchemas
UNION ALL
SELECT 'Total store-schema assignments', COUNT(*) FROM StoreSchemas;
GO
