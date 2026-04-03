'use strict';

/**
 * Maintenance Integration Service
 * Handles communication with the Maintenance App API
 * for creating/linking Work Requests from Food Safety action plans
 */

const https = require('https');
const http = require('http');

class MaintenanceIntegrationService {
    constructor() {
        // Read config from environment
        this.baseUrl = process.env.MAINTENANCE_API_URL || 'https://fsm-uat.gmrlapps.com';
        this.apiKey = process.env.MAINTENANCE_API_KEY || '';
        this.sourceApp = 'FOOD_SAFETY';
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Build request headers for Maintenance API
     */
    _getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Key': this.apiKey,
            'X-Source-App': this.sourceApp
        };
    }

    /**
     * Make HTTP request to Maintenance API
     */
    async _request(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const bodyStr = body ? JSON.stringify(body) : null;
            const headers = this._getHeaders();
            
            if (bodyStr) {
                headers['Content-Length'] = Buffer.byteLength(bodyStr);
            }

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: headers,
                timeout: this.timeout,
                rejectUnauthorized: false // Allow self-signed certs
            };

            console.log(`[MaintenanceService] ${method} ${url.href}`);
            if (bodyStr) console.log(`[MaintenanceService] Body:`, bodyStr.substring(0, 200));

            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`[MaintenanceService] Response ${res.statusCode}: ${data.substring(0, 300)}`);
                    try {
                        const json = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(json);
                        } else {
                            reject(new Error(json.message || `HTTP ${res.statusCode}`));
                        }
                    } catch (e) {
                        reject(new Error(`Invalid JSON response (${res.statusCode}): ${data.substring(0, 200)}`));
                    }
                });
            });

            req.on('error', (err) => {
                console.error(`[MaintenanceService] Request error:`, err.message);
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (bodyStr) {
                req.write(bodyStr);
            }
            req.end();
        });
    }

    /**
     * Get available locations (stores) from Maintenance app
     */
    async getLocations() {
        try {
            const result = await this._request('GET', '/api/external/locations');
            return {
                success: true,
                data: result.data || []
            };
        } catch (error) {
            console.error('[MaintenanceService] getLocations error:', error.message);
            return {
                success: false,
                message: error.message,
                data: []
            };
        }
    }

    /**
     * Get recent Work Requests for a store
     * @param {string} storeCode - Location code
     * @param {number} days - Days to look back (default 30)
     * @param {number} limit - Max number of results (default 20)
     */
    async getRecentWorkRequests(storeCode, days = 30, limit = 20) {
        try {
            const result = await this._request('GET', `/api/external/recent-wrs?storeCode=${encodeURIComponent(storeCode)}&days=${days}&limit=${limit}`);
            return {
                success: true,
                data: result.data || []
            };
        } catch (error) {
            console.error('[MaintenanceService] getRecentWorkRequests error:', error.message);
            return {
                success: false,
                message: error.message,
                data: []
            };
        }
    }

    /**
     * Create a new Work Request from a finding
     * @param {Object} data - Work request data
     * @param {string} data.storeCode - Location code
     * @param {string} data.storeName - Location name (optional)
     * @param {number} data.responseId - ActionPlanResponses.ResponseID
     * @param {string} data.documentNumber - Audit document number
     * @param {string} data.sectionName - Section name
     * @param {string} data.referenceValue - Reference (e.g., "5.3")
     * @param {string} data.finding - Finding description
     * @param {string} data.suggestedAction - Suggested corrective action
     * @param {string} data.priority - Priority level
     */
    async createWorkRequest(data) {
        try {
            const requestBody = {
                storeCode: data.storeCode,
                storeName: data.storeName || '',
                sourceItemId: data.responseId,
                sourceItemType: 'RESPONSE',
                documentNumber: data.documentNumber,
                sectionName: data.sectionName || '',
                referenceValue: data.referenceValue || '',
                finding: data.finding || '',
                suggestedAction: data.suggestedAction || '',
                priority: this._mapPriority(data.priority)
            };

            const result = await this._request('POST', '/api/external/create-wr', requestBody);
            
            return {
                success: true,
                data: {
                    wrNumber: result.data?.WRNumber || result.data?.wrNumber,
                    wrId: result.data?.Id || result.data?.id
                },
                message: 'Work Request created successfully'
            };
        } catch (error) {
            console.error('[MaintenanceService] createWorkRequest error:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Link a finding to an existing Work Request
     * @param {string} wrNumber - Work Request number to link to
     * @param {Object} data - Link data
     */
    async linkToWorkRequest(wrNumber, data) {
        try {
            const requestBody = {
                wrNumber: wrNumber,
                sourceItemId: data.responseId,
                sourceItemType: 'RESPONSE',
                documentNumber: data.documentNumber,
                sectionName: data.sectionName || '',
                referenceValue: data.referenceValue || '',
                finding: data.finding || ''
            };

            const result = await this._request('POST', '/api/external/link-wr', requestBody);
            
            return {
                success: true,
                message: 'Finding linked to Work Request successfully'
            };
        } catch (error) {
            console.error('[MaintenanceService] linkToWorkRequest error:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get status of a Work Request
     * @param {string} wrNumber - Work Request number
     */
    async getWorkRequestStatus(wrNumber) {
        try {
            const result = await this._request('GET', `/api/external/wr-status/${encodeURIComponent(wrNumber)}`);
            return {
                success: true,
                data: result.data || {}
            };
        } catch (error) {
            console.error('[MaintenanceService] getWorkRequestStatus error:', error.message);
            return {
                success: false,
                message: error.message,
                data: {}
            };
        }
    }

    /**
     * Map Food Safety priority to Maintenance priority
     */
    _mapPriority(priority) {
        const mapping = {
            'critical': 'Critical',
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        };
        return mapping[(priority || '').toLowerCase()] || 'Medium';
    }

    /**
     * Test connectivity to Maintenance API
     */
    async testConnection() {
        try {
            const result = await this._request('GET', '/api/external/health');
            return {
                success: true,
                message: 'Connection successful',
                data: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Export singleton
module.exports = new MaintenanceIntegrationService();
