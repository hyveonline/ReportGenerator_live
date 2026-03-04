/**
 * Cycle Service
 * Manages cycle types and cycle definitions for audit scheduling
 * 
 * LIVE Environment: FoodSafetyDB_Live
 */

const sql = require('mssql');

class CycleService {
    constructor() {
        this.pool = null;
    }

    async getPool() {
        if (!this.pool) {
            this.pool = await sql.connect({
                server: 'localhost',
                database: 'FoodSafetyDB_Live',
                user: 'sa',
                password: 'Kokowawa123@@',
                options: { encrypt: false, trustServerCertificate: true }
            });
        }
        return this.pool;
    }

    // ==================== CYCLE TYPES ====================

    /**
     * Get all cycle types
     */
    async getAllCycleTypes() {
        try {
            const pool = await this.getPool();
            const result = await pool.request().query(`
                SELECT 
                    ct.CycleTypeID,
                    ct.TypeName,
                    ct.TypeCode,
                    ct.CyclesPerYear,
                    ct.Description,
                    ct.IsActive,
                    ct.CreatedAt,
                    ct.CreatedBy,
                    (SELECT COUNT(*) FROM AuditSchemas WHERE CycleTypeID = ct.CycleTypeID) as SchemasUsingCount
                FROM CycleTypes ct
                ORDER BY ct.CyclesPerYear DESC
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error getting cycle types:', error);
            throw error;
        }
    }

    /**
     * Get a single cycle type with its definitions
     */
    async getCycleTypeById(cycleTypeId) {
        try {
            const pool = await this.getPool();
            
            // Get the cycle type
            const typeResult = await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query(`
                    SELECT 
                        ct.CycleTypeID,
                        ct.TypeName,
                        ct.TypeCode,
                        ct.CyclesPerYear,
                        ct.Description,
                        ct.IsActive,
                        ct.CreatedAt,
                        ct.CreatedBy,
                        (SELECT COUNT(*) FROM AuditSchemas WHERE CycleTypeID = ct.CycleTypeID) as SchemasUsingCount
                    FROM CycleTypes ct
                    WHERE ct.CycleTypeID = @cycleTypeId
                `);
            
            if (typeResult.recordset.length === 0) {
                return null;
            }

            const cycleType = typeResult.recordset[0];

            // Get definitions for this type
            const defsResult = await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query(`
                    SELECT 
                        CycleDefID,
                        CycleTypeID,
                        CycleNumber,
                        CycleName,
                        StartMonth,
                        EndMonth,
                        DisplayOrder,
                        IsActive
                    FROM CycleDefinitions
                    WHERE CycleTypeID = @cycleTypeId
                    ORDER BY DisplayOrder
                `);

            cycleType.definitions = defsResult.recordset;
            return cycleType;
        } catch (error) {
            console.error('Error getting cycle type:', error);
            throw error;
        }
    }

    /**
     * Create a new cycle type
     */
    async createCycleType(data) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('typeName', sql.NVarChar, data.typeName)
                .input('typeCode', sql.NVarChar, data.typeCode.toUpperCase())
                .input('cyclesPerYear', sql.Int, data.cyclesPerYear)
                .input('description', sql.NVarChar, data.description || null)
                .input('createdBy', sql.NVarChar, data.createdBy || 'System')
                .query(`
                    INSERT INTO CycleTypes (TypeName, TypeCode, CyclesPerYear, Description, CreatedBy)
                    OUTPUT INSERTED.CycleTypeID
                    VALUES (@typeName, @typeCode, @cyclesPerYear, @description, @createdBy)
                `);
            
            return result.recordset[0].CycleTypeID;
        } catch (error) {
            console.error('Error creating cycle type:', error);
            throw error;
        }
    }

    /**
     * Update a cycle type
     */
    async updateCycleType(cycleTypeId, data) {
        try {
            const pool = await this.getPool();
            await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .input('typeName', sql.NVarChar, data.typeName)
                .input('typeCode', sql.NVarChar, data.typeCode.toUpperCase())
                .input('cyclesPerYear', sql.Int, data.cyclesPerYear)
                .input('description', sql.NVarChar, data.description || null)
                .input('isActive', sql.Bit, data.isActive !== false)
                .query(`
                    UPDATE CycleTypes
                    SET TypeName = @typeName,
                        TypeCode = @typeCode,
                        CyclesPerYear = @cyclesPerYear,
                        Description = @description,
                        IsActive = @isActive
                    WHERE CycleTypeID = @cycleTypeId
                `);
            
            return true;
        } catch (error) {
            console.error('Error updating cycle type:', error);
            throw error;
        }
    }

    /**
     * Delete a cycle type (only if not in use)
     */
    async deleteCycleType(cycleTypeId) {
        try {
            const pool = await this.getPool();
            
            // Check if in use
            const usageCheck = await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query(`
                    SELECT COUNT(*) as cnt FROM AuditSchemas WHERE CycleTypeID = @cycleTypeId
                `);
            
            if (usageCheck.recordset[0].cnt > 0) {
                throw new Error('Cannot delete cycle type that is in use by schemas');
            }

            // Delete definitions first
            await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query('DELETE FROM CycleDefinitions WHERE CycleTypeID = @cycleTypeId');

            // Delete the type
            await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query('DELETE FROM CycleTypes WHERE CycleTypeID = @cycleTypeId');
            
            return true;
        } catch (error) {
            console.error('Error deleting cycle type:', error);
            throw error;
        }
    }

    // ==================== CYCLE DEFINITIONS ====================

    /**
     * Get all definitions for a cycle type
     */
    async getCycleDefinitions(cycleTypeId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query(`
                    SELECT 
                        CycleDefID,
                        CycleTypeID,
                        CycleNumber,
                        CycleName,
                        StartMonth,
                        EndMonth,
                        DisplayOrder,
                        IsActive
                    FROM CycleDefinitions
                    WHERE CycleTypeID = @cycleTypeId
                    ORDER BY DisplayOrder
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error getting cycle definitions:', error);
            throw error;
        }
    }

    /**
     * Add a new cycle definition
     */
    async addCycleDefinition(cycleTypeId, data) {
        try {
            const pool = await this.getPool();
            
            // Get max display order
            const maxOrder = await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query('SELECT ISNULL(MAX(DisplayOrder), 0) + 1 as nextOrder FROM CycleDefinitions WHERE CycleTypeID = @cycleTypeId');
            
            const result = await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .input('cycleNumber', sql.NVarChar, data.cycleNumber)
                .input('cycleName', sql.NVarChar, data.cycleName)
                .input('startMonth', sql.Int, data.startMonth)
                .input('endMonth', sql.Int, data.endMonth)
                .input('displayOrder', sql.Int, data.displayOrder || maxOrder.recordset[0].nextOrder)
                .query(`
                    INSERT INTO CycleDefinitions (CycleTypeID, CycleNumber, CycleName, StartMonth, EndMonth, DisplayOrder)
                    OUTPUT INSERTED.CycleDefID
                    VALUES (@cycleTypeId, @cycleNumber, @cycleName, @startMonth, @endMonth, @displayOrder)
                `);
            
            // Update CyclesPerYear in CycleTypes
            await this.updateCyclesPerYearCount(cycleTypeId);
            
            return result.recordset[0].CycleDefID;
        } catch (error) {
            console.error('Error adding cycle definition:', error);
            throw error;
        }
    }

    /**
     * Update a cycle definition
     */
    async updateCycleDefinition(cycleDefId, data) {
        try {
            const pool = await this.getPool();
            await pool.request()
                .input('cycleDefId', sql.Int, cycleDefId)
                .input('cycleNumber', sql.NVarChar, data.cycleNumber)
                .input('cycleName', sql.NVarChar, data.cycleName)
                .input('startMonth', sql.Int, data.startMonth)
                .input('endMonth', sql.Int, data.endMonth)
                .input('displayOrder', sql.Int, data.displayOrder)
                .input('isActive', sql.Bit, data.isActive !== false)
                .query(`
                    UPDATE CycleDefinitions
                    SET CycleNumber = @cycleNumber,
                        CycleName = @cycleName,
                        StartMonth = @startMonth,
                        EndMonth = @endMonth,
                        DisplayOrder = @displayOrder,
                        IsActive = @isActive
                    WHERE CycleDefID = @cycleDefId
                `);
            
            return true;
        } catch (error) {
            console.error('Error updating cycle definition:', error);
            throw error;
        }
    }

    /**
     * Delete a cycle definition
     */
    async deleteCycleDefinition(cycleDefId) {
        try {
            const pool = await this.getPool();
            
            // Get the CycleTypeID before deleting
            const defResult = await pool.request()
                .input('cycleDefId', sql.Int, cycleDefId)
                .query('SELECT CycleTypeID FROM CycleDefinitions WHERE CycleDefID = @cycleDefId');
            
            const cycleTypeId = defResult.recordset[0]?.CycleTypeID;

            await pool.request()
                .input('cycleDefId', sql.Int, cycleDefId)
                .query('DELETE FROM CycleDefinitions WHERE CycleDefID = @cycleDefId');
            
            // Update CyclesPerYear count
            if (cycleTypeId) {
                await this.updateCyclesPerYearCount(cycleTypeId);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting cycle definition:', error);
            throw error;
        }
    }

    /**
     * Update CyclesPerYear based on actual definitions count
     */
    async updateCyclesPerYearCount(cycleTypeId) {
        try {
            const pool = await this.getPool();
            await pool.request()
                .input('cycleTypeId', sql.Int, cycleTypeId)
                .query(`
                    UPDATE CycleTypes
                    SET CyclesPerYear = (
                        SELECT COUNT(*) FROM CycleDefinitions 
                        WHERE CycleTypeID = @cycleTypeId AND IsActive = 1
                    )
                    WHERE CycleTypeID = @cycleTypeId
                `);
        } catch (error) {
            console.error('Error updating cycles per year count:', error);
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get cycles for a schema (used by Start Audit page)
     */
    async getCyclesForSchema(schemaId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('schemaId', sql.Int, schemaId)
                .query(`
                    SELECT 
                        cd.CycleDefID,
                        cd.CycleNumber,
                        cd.CycleName,
                        cd.StartMonth,
                        cd.EndMonth,
                        cd.DisplayOrder,
                        ct.TypeName as CycleTypeName,
                        ct.TypeCode as CycleTypeCode
                    FROM AuditSchemas s
                    INNER JOIN CycleTypes ct ON s.CycleTypeID = ct.CycleTypeID
                    INNER JOIN CycleDefinitions cd ON ct.CycleTypeID = cd.CycleTypeID
                    WHERE s.SchemaID = @schemaId AND cd.IsActive = 1
                    ORDER BY cd.DisplayOrder
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error getting cycles for schema:', error);
            throw error;
        }
    }

    /**
     * Get cycle display name for a specific audit (used by Report Generator)
     */
    async getCycleDisplayName(schemaId, cycleNumber) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('schemaId', sql.Int, schemaId)
                .input('cycleNumber', sql.NVarChar, cycleNumber)
                .query(`
                    SELECT 
                        cd.CycleNumber,
                        cd.CycleName,
                        ct.TypeName as CycleTypeName
                    FROM AuditSchemas s
                    INNER JOIN CycleTypes ct ON s.CycleTypeID = ct.CycleTypeID
                    INNER JOIN CycleDefinitions cd ON ct.CycleTypeID = cd.CycleTypeID
                    WHERE s.SchemaID = @schemaId AND cd.CycleNumber = @cycleNumber
                `);
            
            if (result.recordset.length > 0) {
                const cycle = result.recordset[0];
                return `${cycle.CycleNumber} (${cycle.CycleName})`;
            }
            return cycleNumber; // Fallback to just cycle number
        } catch (error) {
            console.error('Error getting cycle display name:', error);
            return cycleNumber; // Fallback
        }
    }

    /**
     * Get current cycle based on date and schema
     */
    async getCurrentCycle(schemaId, date = new Date()) {
        try {
            const month = date.getMonth() + 1; // JavaScript months are 0-indexed
            const pool = await this.getPool();
            const result = await pool.request()
                .input('schemaId', sql.Int, schemaId)
                .input('month', sql.Int, month)
                .query(`
                    SELECT 
                        cd.CycleNumber,
                        cd.CycleName
                    FROM AuditSchemas s
                    INNER JOIN CycleTypes ct ON s.CycleTypeID = ct.CycleTypeID
                    INNER JOIN CycleDefinitions cd ON ct.CycleTypeID = cd.CycleTypeID
                    WHERE s.SchemaID = @schemaId 
                      AND cd.IsActive = 1
                      AND @month BETWEEN cd.StartMonth AND cd.EndMonth
                `);
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error getting current cycle:', error);
            return null;
        }
    }
}

module.exports = new CycleService();
