'use strict';

/**
 * Maintenance Integration Routes
 * Handles Work Request creation/linking from Food Safety action plans
 */

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const maintenanceService = require('../services/maintenance-integration.service');

/**
 * GET /api/maintenance/locations
 * Get available locations (stores) from Maintenance app
 */
router.get('/locations', async (req, res) => {
    try {
        const result = await maintenanceService.getLocations();
        res.json(result);
    } catch (error) {
        console.error('[MaintenanceRoutes] Error getting locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get locations: ' + error.message
        });
    }
});

/**
 * GET /api/maintenance/recent-wrs
 * Get recent Work Requests for a store
 */
router.get('/recent-wrs', async (req, res) => {
    try {
        const { storeCode, days, limit } = req.query;
        
        // If no storeCode, return empty list (data not loaded yet)
        if (!storeCode) {
            return res.json({
                success: true,
                data: [],
                message: 'No store code provided'
            });
        }

        const result = await maintenanceService.getRecentWorkRequests(storeCode, parseInt(days) || 30, parseInt(limit) || 20);
        res.json(result);
    } catch (error) {
        console.error('[MaintenanceRoutes] Error getting recent WRs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent work requests: ' + error.message
        });
    }
});

/**
 * POST /api/maintenance/create-wr
 * Create a new Work Request from an action plan finding
 */
router.post('/create-wr', async (req, res) => {
    try {
        console.log('[MaintenanceRoutes] create-wr request body:', JSON.stringify(req.body));
        
        const {
            responseId,
            documentNumber,
            storeCode,
            storeName,
            sectionName,
            referenceValue,
            finding,
            suggestedAction,
            priority
        } = req.body;

        // Validate required fields
        if (!responseId || !documentNumber || !storeCode) {
            console.log('[MaintenanceRoutes] Validation failed:', { responseId, documentNumber, storeCode });
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${!responseId ? 'responseId' : ''} ${!documentNumber ? 'documentNumber' : ''} ${!storeCode ? 'storeCode' : ''}`
            });
        }

        // Get user from session
        const userName = req.session?.user?.displayName || req.session?.user?.userPrincipalName || 'System';

        console.log('[MaintenanceRoutes] Creating WR with:', { storeCode, responseId, documentNumber });

        // Create WR in Maintenance app
        const createResult = await maintenanceService.createWorkRequest({
            storeCode,
            storeName,
            responseId,
            documentNumber,
            sectionName,
            referenceValue,
            finding,
            suggestedAction,
            priority
        });

        console.log('[MaintenanceRoutes] Create result:', JSON.stringify(createResult));

        if (!createResult.success) {
            return res.status(500).json(createResult);
        }

        // Update ActionPlanResponses with WR info
        // Note: ActionPlanResponses uses DocumentNumber + ReferenceValue as key, not the audit ResponseID
        // Use MERGE to handle case where ActionPlanResponses record doesn't exist yet
        const pool = await require('../database/db-connection').getPool();
        await pool.request()
            .input('documentNumber', sql.NVarChar(50), documentNumber)
            .input('referenceValue', sql.NVarChar(50), referenceValue)
            .input('sectionName', sql.NVarChar(100), sectionName || '')
            .input('finding', sql.NVarChar(sql.MAX), finding || '')
            .input('suggestedAction', sql.NVarChar(sql.MAX), suggestedAction || '')
            .input('priority', sql.NVarChar(20), priority || 'Medium')
            .input('wrNumber', sql.NVarChar(50), createResult.data.wrNumber)
            .input('userName', sql.NVarChar(100), userName)
            .query(`
                MERGE ActionPlanResponses AS target
                USING (SELECT @documentNumber AS DocumentNumber, @referenceValue AS ReferenceValue) AS source
                ON target.DocumentNumber = source.DocumentNumber AND target.ReferenceValue = source.ReferenceValue
                WHEN MATCHED THEN
                    UPDATE SET 
                        MaintenanceWRNumber = @wrNumber,
                        SentToMaintenance = 1,
                        SentToMaintenanceAt = GETDATE(),
                        SentToMaintenanceBy = @userName,
                        UpdatedDate = GETDATE(),
                        UpdatedBy = @userName
                WHEN NOT MATCHED THEN
                    INSERT (DocumentNumber, ReferenceValue, Section, Finding, SuggestedAction, Priority, Status, 
                            MaintenanceWRNumber, SentToMaintenance, SentToMaintenanceAt, SentToMaintenanceBy, 
                            CreatedDate, CreatedBy)
                    VALUES (@documentNumber, @referenceValue, @sectionName, @finding, @suggestedAction, @priority, 'Pending',
                            @wrNumber, 1, GETDATE(), @userName, 
                            GETDATE(), @userName);
            `);

        console.log(`[MaintenanceRoutes] Created WR ${createResult.data.wrNumber} for ResponseID ${responseId}`);

        res.json({
            success: true,
            data: createResult.data,
            message: 'Work Request created successfully'
        });

    } catch (error) {
        console.error('[MaintenanceRoutes] Error creating WR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create work request: ' + error.message
        });
    }
});

/**
 * POST /api/maintenance/link-wr
 * Link an action plan finding to an existing Work Request
 */
router.post('/link-wr', async (req, res) => {
    try {
        const {
            responseId,
            wrNumber,
            documentNumber,
            storeCode,
            sectionName,
            referenceValue,
            finding
        } = req.body;

        // Validate required fields
        if (!wrNumber || !documentNumber || !referenceValue) {
            return res.status(400).json({
                success: false,
                message: 'wrNumber, documentNumber and referenceValue are required'
            });
        }

        // Get user from session
        const userName = req.session?.user?.displayName || req.session?.user?.userPrincipalName || 'System';

        // Link in Maintenance app
        const linkResult = await maintenanceService.linkToWorkRequest(wrNumber, {
            responseId,
            documentNumber,
            storeCode,
            sectionName,
            referenceValue,
            finding
        });

        if (!linkResult.success) {
            return res.status(500).json(linkResult);
        }

        // Update ActionPlanResponses with WR info
        // Note: ActionPlanResponses uses DocumentNumber + ReferenceValue as key
        // Use MERGE to handle case where ActionPlanResponses record doesn't exist yet
        const pool = await require('../database/db-connection').getPool();
        await pool.request()
            .input('documentNumber', sql.NVarChar(50), documentNumber)
            .input('referenceValue', sql.NVarChar(50), referenceValue)
            .input('sectionName', sql.NVarChar(100), sectionName || '')
            .input('finding', sql.NVarChar(sql.MAX), finding || '')
            .input('wrNumber', sql.NVarChar(50), wrNumber)
            .input('userName', sql.NVarChar(100), userName)
            .query(`
                MERGE ActionPlanResponses AS target
                USING (SELECT @documentNumber AS DocumentNumber, @referenceValue AS ReferenceValue) AS source
                ON target.DocumentNumber = source.DocumentNumber AND target.ReferenceValue = source.ReferenceValue
                WHEN MATCHED THEN
                    UPDATE SET 
                        MaintenanceWRNumber = @wrNumber,
                        SentToMaintenance = 1,
                        SentToMaintenanceAt = GETDATE(),
                        SentToMaintenanceBy = @userName,
                        UpdatedDate = GETDATE(),
                        UpdatedBy = @userName
                WHEN NOT MATCHED THEN
                    INSERT (DocumentNumber, ReferenceValue, Section, Finding, Priority, Status, 
                            MaintenanceWRNumber, SentToMaintenance, SentToMaintenanceAt, SentToMaintenanceBy, 
                            CreatedDate, CreatedBy)
                    VALUES (@documentNumber, @referenceValue, @sectionName, @finding, 'Medium', 'Pending',
                            @wrNumber, 1, GETDATE(), @userName, 
                            GETDATE(), @userName);
            `);

        console.log(`[MaintenanceRoutes] Linked ${documentNumber}/${referenceValue} to WR ${wrNumber}`);

        res.json({
            success: true,
            message: 'Finding linked to Work Request successfully'
        });

    } catch (error) {
        console.error('[MaintenanceRoutes] Error linking WR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link work request: ' + error.message
        });
    }
});

/**
 * GET /api/maintenance/wr-status/:wrNumber
 * Get status of a Work Request
 */
router.get('/wr-status/:wrNumber', async (req, res) => {
    try {
        const { wrNumber } = req.params;

        if (!wrNumber) {
            return res.status(400).json({
                success: false,
                message: 'wrNumber is required'
            });
        }

        const result = await maintenanceService.getWorkRequestStatus(wrNumber);
        res.json(result);

    } catch (error) {
        console.error('[MaintenanceRoutes] Error getting WR status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get work request status: ' + error.message
        });
    }
});

/**
 * GET /api/maintenance/action-plan-wrs/:documentNumber
 * Get all WRs linked to an action plan
 */
router.get('/action-plan-wrs/:documentNumber', async (req, res) => {
    try {
        const { documentNumber } = req.params;

        const pool = await require('../database/db-connection').getPool();
        const result = await pool.request()
            .input('documentNumber', sql.NVarChar(50), documentNumber)
            .query(`
                SELECT 
                    ResponseID,
                    ReferenceValue,
                    Section,
                    MaintenanceWRNumber,
                    SentToMaintenanceAt,
                    SentToMaintenanceBy
                FROM ActionPlanResponses
                WHERE DocumentNumber = @documentNumber
                  AND SentToMaintenance = 1
                  AND MaintenanceWRNumber IS NOT NULL
                ORDER BY ReferenceValue
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('[MaintenanceRoutes] Error getting action plan WRs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get action plan work requests: ' + error.message
        });
    }
});

/**
 * GET /api/maintenance/test
 * Test connectivity to Maintenance API
 */
router.get('/test', async (req, res) => {
    try {
        const result = await maintenanceService.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Connection test failed: ' + error.message
        });
    }
});

module.exports = router;
