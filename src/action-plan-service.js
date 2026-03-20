/**
 * Action Plan Service
 * Business logic for Action Plan operations
 */

const SQLConnector = require('./sql-connector');
const sql = require('mssql');

// Debug flag - set DEBUG_ACTION_PLAN=true to enable verbose logging
const DEBUG_VERBOSE = process.env.DEBUG_ACTION_PLAN === 'true' || false;

class ActionPlanService {
    constructor() {
        this.sqlConnector = new SQLConnector();
    }

    /**
     * Save Action Plan Response (Insert or Update)
     */
    async saveResponse(responseData) {
        try {
            if (DEBUG_VERBOSE) console.log(`💾 Saving action plan response for ${responseData.documentNumber} - ${responseData.referenceValue}`);
            
            const pool = await this.sqlConnector.connect();
            const request = pool.request();

            // Add all parameters
            request.input('DocumentNumber', sql.NVarChar(50), responseData.documentNumber);
            request.input('ReferenceValue', sql.NVarChar(20), responseData.referenceValue);
            request.input('Section', sql.NVarChar(100), responseData.section);
            request.input('Finding', sql.NVarChar(sql.MAX), responseData.finding);
            request.input('SuggestedAction', sql.NVarChar(sql.MAX), responseData.suggestedAction || '');
            request.input('Priority', sql.NVarChar(20), responseData.priority);
            request.input('ActionTaken', sql.NVarChar(sql.MAX), responseData.actionTaken || '');
            request.input('Deadline', sql.Date, responseData.deadline || null);
            request.input('PersonInCharge', sql.NVarChar(100), responseData.personInCharge || '');
            request.input('Status', sql.NVarChar(50), responseData.status || 'Pending');
            request.input('PicturesPaths', sql.NVarChar(sql.MAX), responseData.picturesPaths || '');
            request.input('UpdatedBy', sql.NVarChar(100), responseData.updatedBy || 'System');

            const result = await request.execute('sp_SaveActionPlanResponse');
            
            if (DEBUG_VERBOSE) console.log(`✅ Action plan response saved successfully (ID: ${result.recordset[0].ResponseID})`);
            
            return {
                success: true,
                responseId: result.recordset[0].ResponseID,
                message: 'Action plan response saved successfully'
            };
        } catch (error) {
            console.error('❌ Error saving action plan response:', error.message);
            throw error;
        }
    }

    /**
     * Save Multiple Responses (Batch)
     */
    async saveMultipleResponses(responses, updatedBy = 'System') {
        try {
            if (DEBUG_VERBOSE) console.log(`💾 Saving ${responses.length} action plan responses...`);
            
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const response of responses) {
                try {
                    response.updatedBy = updatedBy;
                    const result = await this.saveResponse(response);
                    results.push(result);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Error saving response ${response.referenceValue}:`, error.message);
                    results.push({
                        success: false,
                        referenceValue: response.referenceValue,
                        error: error.message
                    });
                    errorCount++;
                }
            }

            if (DEBUG_VERBOSE) console.log(`✅ Batch save complete: ${successCount} succeeded, ${errorCount} failed`);

            return {
                success: errorCount === 0,
                totalProcessed: responses.length,
                successCount,
                errorCount,
                results
            };
        } catch (error) {
            console.error('❌ Error in batch save:', error.message);
            throw error;
        }
    }

    /**
     * Get Action Plan Responses for a Document
     * @param {string} documentNumber - The document number
     * @param {boolean} includePictures - Whether to include picture data (default: true since we now store URLs not base64)
     */
    async getResponses(documentNumber, includePictures = true) {
        try {
            if (DEBUG_VERBOSE) console.log(`📋 Fetching action plan responses for ${documentNumber} (includePictures: ${includePictures})...`);
            
            const pool = await this.sqlConnector.connect();
            const request = pool.request();
            request.input('DocumentNumber', sql.NVarChar(50), documentNumber);

            const result = await request.execute('sp_GetActionPlanResponses');
            
            if (DEBUG_VERBOSE) console.log(`✅ Found ${result.recordset.length} action plan responses`);
            
            // Pictures are now URLs (small) so we include them by default
            // Only strip if explicitly requested not to include
            if (!includePictures) {
                result.recordset.forEach(r => {
                    if (r.PicturesPaths && r.PicturesPaths !== '[]') {
                        try {
                            const pics = JSON.parse(r.PicturesPaths);
                            r.HasPictures = pics.length > 0;
                            r.PictureCount = pics.length;
                        } catch {
                            r.HasPictures = false;
                            r.PictureCount = 0;
                        }
                    } else {
                        r.HasPictures = false;
                        r.PictureCount = 0;
                    }
                    r.PicturesPaths = null; // Don't send the actual data
                });
            }
            
            return result.recordset;
        } catch (error) {
            console.error('❌ Error getting action plan responses:', error.message);
            throw error;
        }
    }

    /**
     * Get Summary Statistics for a Document
     */
    async getSummary(documentNumber) {
        try {
            if (DEBUG_VERBOSE) console.log(`📊 Fetching action plan summary for ${documentNumber}...`);
            
            const pool = await this.sqlConnector.connect();
            const request = pool.request();
            request.input('DocumentNumber', sql.NVarChar(50), documentNumber);

            const result = await request.execute('sp_GetActionPlanSummary');
            
            if (result.recordset.length > 0) {
                if (DEBUG_VERBOSE) console.log(`✅ Summary retrieved:`, result.recordset[0]);
                return result.recordset[0];
            } else {
                return {
                    TotalActions: 0,
                    CriticalCount: 0,
                    HighCount: 0,
                    MediumCount: 0,
                    LowCount: 0,
                    CompletedCount: 0,
                    InProgressCount: 0,
                    PendingCount: 0
                };
            }
        } catch (error) {
            console.error('❌ Error getting action plan summary:', error.message);
            throw error;
        }
    }

    /**
     * Delete Action Plan Response
     */
    async deleteResponse(responseId) {
        try {
            if (DEBUG_VERBOSE) console.log(`🗑️ Deleting action plan response ${responseId}...`);
            
            const pool = await this.sqlConnector.connect();
            const result = await pool.request()
                .input('ResponseID', sql.Int, responseId)
                .query('DELETE FROM ActionPlanResponses WHERE ResponseID = @ResponseID');
            
            if (DEBUG_VERBOSE) console.log(`✅ Action plan response deleted`);
            
            return {
                success: true,
                message: 'Response deleted successfully'
            };
        } catch (error) {
            console.error('❌ Error deleting action plan response:', error.message);
            throw error;
        }
    }

    /**
     * Get Audit Log for a Response
     */
    async getAuditLog(responseId) {
        try {
            const pool = await this.sqlConnector.connect();
            const result = await pool.request()
                .input('ResponseID', sql.Int, responseId)
                .query(`
                    SELECT 
                        AuditID,
                        Action,
                        FieldChanged,
                        OldValue,
                        NewValue,
                        ChangedBy,
                        ChangedDate
                    FROM ActionPlanAuditLog
                    WHERE ResponseID = @ResponseID
                    ORDER BY ChangedDate DESC
                `);
            
            return result.recordset;
        } catch (error) {
            console.error('❌ Error getting audit log:', error.message);
            throw error;
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        return await this.sqlConnector.testConnection();
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        await this.sqlConnector.disconnect();
    }
}

module.exports = ActionPlanService;
