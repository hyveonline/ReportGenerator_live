/**
 * Gallery Service - Manages audit picture gallery with file storage
 * 
 * Features:
 * - Upload pictures to gallery with compression
 * - Generate thumbnails
 * - Store metadata (GPS, device info, etc.)
 * - Assign pictures to audit responses
 * - Support for camera capture, bulk upload
 */

const sql = require('mssql');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Configuration
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'audit-gallery');
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;
const IMAGE_QUALITY = 80;
const THUMBNAIL_SIZE = 200;

// Database configuration
const dbConfig = {
    server: 'localhost',
    database: 'FoodSafetyDB_Live',
    user: 'sa',
    password: 'Kokowawa123@@',
    options: { encrypt: false, trustServerCertificate: true }
};

class GalleryService {
    constructor() {
        this.pool = null;
    }

    async getPool() {
        if (!this.pool) {
            this.pool = await sql.connect(dbConfig);
        }
        return this.pool;
    }

    /**
     * Ensure upload directory exists for an audit
     */
    async ensureUploadDir(auditId) {
        const auditDir = path.join(UPLOAD_DIR, String(auditId));
        const thumbDir = path.join(auditDir, 'thumbnails');
        
        await fs.mkdir(auditDir, { recursive: true });
        await fs.mkdir(thumbDir, { recursive: true });
        
        return { auditDir, thumbDir };
    }

    /**
     * Upload a picture to the gallery
     */
    async uploadPicture(params) {
        const {
            auditId,
            base64Data,
            originalFileName,
            contentType,
            category,
            caption,
            latitude,
            longitude,
            deviceInfo,
            createdBy
        } = params;

        try {
            const { auditDir, thumbDir } = await this.ensureUploadDir(auditId);

            const ext = this.getExtension(contentType, originalFileName);
            const uniqueId = uuidv4().substring(0, 8);
            const fileName = `pic_${Date.now()}_${uniqueId}${ext}`;
            const thumbFileName = `thumb_${fileName}`;

            const filePath = path.join(auditDir, fileName);
            const thumbPath = path.join(thumbDir, thumbFileName);

            const imageBuffer = Buffer.from(base64Data, 'base64');

            // Compress and save main image
            const processedImage = await sharp(imageBuffer)
                .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: IMAGE_QUALITY })
                .toBuffer();

            await fs.writeFile(filePath, processedImage);

            // Generate thumbnail
            const thumbnail = await sharp(imageBuffer)
                .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover' })
                .jpeg({ quality: 70 })
                .toBuffer();

            await fs.writeFile(thumbPath, thumbnail);

            const stats = await fs.stat(filePath);

            const pool = await this.getPool();
            const result = await pool.request()
                .input('AuditID', sql.Int, auditId)
                .input('FileName', sql.NVarChar, fileName)
                .input('OriginalFileName', sql.NVarChar, originalFileName)
                .input('FilePath', sql.NVarChar, filePath)
                .input('ThumbnailPath', sql.NVarChar, thumbPath)
                .input('ContentType', sql.NVarChar, 'image/jpeg')
                .input('FileSize', sql.Int, stats.size)
                .input('Category', sql.NVarChar, category || null)
                .input('Caption', sql.NVarChar, caption || null)
                .input('Latitude', sql.Decimal(10, 7), latitude || null)
                .input('Longitude', sql.Decimal(10, 7), longitude || null)
                .input('DeviceInfo', sql.NVarChar, deviceInfo || null)
                .input('CreatedBy', sql.NVarChar, createdBy || null)
                .query(`
                    INSERT INTO AuditGalleryPictures (
                        AuditID, FileName, OriginalFileName, FilePath, ThumbnailPath,
                        ContentType, FileSize, Category, Caption, Latitude, Longitude,
                        DeviceInfo, CreatedBy
                    )
                    OUTPUT INSERTED.PictureID
                    VALUES (
                        @AuditID, @FileName, @OriginalFileName, @FilePath, @ThumbnailPath,
                        @ContentType, @FileSize, @Category, @Caption, @Latitude, @Longitude,
                        @DeviceInfo, @CreatedBy
                    )
                `);

            const pictureId = result.recordset[0].PictureID;
            console.log(`[Gallery] Uploaded picture ${pictureId} for audit ${auditId}: ${fileName}`);

            return {
                pictureId,
                fileName,
                originalFileName,
                category,
                caption,
                assignmentCount: 0,
                thumbnailUrl: `/api/gallery/${auditId}/${pictureId}/thumbnail`,
                imageUrl: `/api/gallery/${auditId}/${pictureId}/image`
            };

        } catch (error) {
            console.error('[Gallery] Error uploading picture:', error);
            throw error;
        }
    }

    /**
     * Get all pictures in an audit's gallery
     */
    async getGalleryPictures(auditId, category = null) {
        try {
            const pool = await this.getPool();
            
            let query = `
                SELECT 
                    p.PictureID, p.FileName, p.OriginalFileName, p.ContentType,
                    p.FileSize, p.Category, p.Caption, p.Latitude, p.Longitude,
                    p.DeviceInfo, p.CreatedAt, p.CreatedBy,
                    (SELECT COUNT(*) FROM AuditPictureAssignments a WHERE a.PictureID = p.PictureID) as AssignmentCount,
                    (SELECT TOP 1 a.PictureType FROM AuditPictureAssignments a WHERE a.PictureID = p.PictureID) as AssignedPictureType,
                    (SELECT TOP 1 ar.ReferenceValue FROM AuditPictureAssignments a 
                     INNER JOIN AuditResponses ar ON a.ResponseID = ar.ResponseID 
                     WHERE a.PictureID = p.PictureID) as AssignedReferenceValue
                FROM AuditGalleryPictures p
                WHERE p.AuditID = @AuditID
            `;

            if (category) query += ` AND p.Category = @Category`;
            query += ` ORDER BY p.CreatedAt DESC`;

            const request = pool.request().input('AuditID', sql.Int, auditId);
            if (category) request.input('Category', sql.NVarChar, category);

            const result = await request.query(query);

            return result.recordset.map(pic => ({
                pictureId: pic.PictureID,
                fileName: pic.FileName,
                originalFileName: pic.OriginalFileName,
                fileSize: pic.FileSize,
                category: pic.Category,
                caption: pic.Caption,
                latitude: pic.Latitude,
                longitude: pic.Longitude,
                createdAt: pic.CreatedAt,
                assignmentCount: pic.AssignmentCount,
                assignedPictureType: pic.AssignedPictureType,
                assignedReferenceValue: pic.AssignedReferenceValue,
                thumbnailUrl: `/api/gallery/${auditId}/${pic.PictureID}/thumbnail`,
                imageUrl: `/api/gallery/${auditId}/${pic.PictureID}/image`
            }));

        } catch (error) {
            console.error('[Gallery] Error getting gallery pictures:', error);
            throw error;
        }
    }

    /**
     * Get picture file for serving
     */
    async getPictureFile(pictureId, type = 'image') {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .query(`SELECT FilePath, ThumbnailPath, ContentType FROM AuditGalleryPictures WHERE PictureID = @PictureID`);

            if (result.recordset.length === 0) return null;

            const pic = result.recordset[0];
            const filePath = type === 'thumbnail' ? pic.ThumbnailPath : pic.FilePath;
            const fileBuffer = await fs.readFile(filePath);
            
            return { buffer: fileBuffer, contentType: pic.ContentType };

        } catch (error) {
            console.error('[Gallery] Error getting picture file:', error);
            throw error;
        }
    }

    /**
     * Delete a picture from gallery
     */
    async deletePicture(pictureId) {
        try {
            const pool = await this.getPool();

            const result = await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .query(`SELECT FilePath, ThumbnailPath FROM AuditGalleryPictures WHERE PictureID = @PictureID`);

            if (result.recordset.length === 0) throw new Error('Picture not found');

            const { FilePath, ThumbnailPath } = result.recordset[0];

            // Delete assignments first
            await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .query(`DELETE FROM AuditPictureAssignments WHERE PictureID = @PictureID`);

            // Delete from database
            await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .query(`DELETE FROM AuditGalleryPictures WHERE PictureID = @PictureID`);

            // Delete files
            try {
                await fs.unlink(FilePath);
                if (ThumbnailPath) await fs.unlink(ThumbnailPath);
            } catch (fileError) {
                console.warn('[Gallery] Could not delete files:', fileError.message);
            }

            console.log(`[Gallery] Deleted picture ${pictureId}`);
            return true;

        } catch (error) {
            console.error('[Gallery] Error deleting picture:', error);
            throw error;
        }
    }

    /**
     * Assign a picture to a response
     */
    async assignPicture(pictureId, responseId, pictureType) {
        try {
            const pool = await this.getPool();

            const existingResult = await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .input('ResponseID', sql.Int, responseId)
                .input('PictureType', sql.NVarChar, pictureType)
                .query(`
                    SELECT AssignmentID FROM AuditPictureAssignments
                    WHERE PictureID = @PictureID AND ResponseID = @ResponseID AND PictureType = @PictureType
                `);

            if (existingResult.recordset.length > 0) {
                return { assignmentId: existingResult.recordset[0].AssignmentID, alreadyExists: true };
            }

            const result = await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .input('ResponseID', sql.Int, responseId)
                .input('PictureType', sql.NVarChar, pictureType)
                .query(`
                    INSERT INTO AuditPictureAssignments (PictureID, ResponseID, PictureType)
                    OUTPUT INSERTED.AssignmentID
                    VALUES (@PictureID, @ResponseID, @PictureType)
                `);

            console.log(`[Gallery] Assigned picture ${pictureId} to response ${responseId} as ${pictureType}`);
            return { assignmentId: result.recordset[0].AssignmentID, alreadyExists: false };

        } catch (error) {
            console.error('[Gallery] Error assigning picture:', error);
            throw error;
        }
    }

    /**
     * Unassign a picture from a response
     */
    async unassignPicture(assignmentId) {
        try {
            const pool = await this.getPool();
            await pool.request()
                .input('AssignmentID', sql.Int, assignmentId)
                .query(`DELETE FROM AuditPictureAssignments WHERE AssignmentID = @AssignmentID`);

            console.log(`[Gallery] Removed assignment ${assignmentId}`);
            return true;

        } catch (error) {
            console.error('[Gallery] Error unassigning picture:', error);
            throw error;
        }
    }

    /**
     * Get all assignments for a response
     */
    async getResponseAssignments(responseId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('ResponseID', sql.Int, responseId)
                .query(`
                    SELECT a.AssignmentID, a.PictureID, a.PictureType, a.AssignedAt,
                           p.FileName, p.Category, p.Caption, p.AuditID
                    FROM AuditPictureAssignments a
                    INNER JOIN AuditGalleryPictures p ON a.PictureID = p.PictureID
                    WHERE a.ResponseID = @ResponseID
                    ORDER BY a.AssignedAt DESC
                `);

            return result.recordset.map(r => ({
                assignmentId: r.AssignmentID,
                pictureId: r.PictureID,
                pictureType: r.PictureType,
                fileName: r.FileName,
                category: r.Category,
                thumbnailUrl: `/api/gallery/${r.AuditID}/${r.PictureID}/thumbnail`,
                imageUrl: `/api/gallery/${r.AuditID}/${r.PictureID}/image`
            }));

        } catch (error) {
            console.error('[Gallery] Error getting response assignments:', error);
            throw error;
        }
    }

    /**
     * Get all assignments for an audit (for report generation)
     */
    async getAuditAssignments(auditId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('AuditID', sql.Int, auditId)
                .query(`
                    SELECT a.AssignmentID, a.PictureID, a.ResponseID, a.PictureType,
                           p.FileName, p.FilePath, p.Category, p.Caption,
                           r.ReferenceValue, r.SectionName
                    FROM AuditPictureAssignments a
                    INNER JOIN AuditGalleryPictures p ON a.PictureID = p.PictureID
                    INNER JOIN AuditResponses r ON a.ResponseID = r.ResponseID
                    WHERE p.AuditID = @AuditID
                    ORDER BY r.SectionNumber, r.ReferenceValue, a.PictureType
                `);

            return result.recordset;

        } catch (error) {
            console.error('[Gallery] Error getting audit assignments:', error);
            throw error;
        }
    }

    /**
     * Get picture as base64 for report generation
     */
    async getPictureBase64(pictureId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('PictureID', sql.Int, pictureId)
                .query(`SELECT FilePath, ContentType FROM AuditGalleryPictures WHERE PictureID = @PictureID`);

            if (result.recordset.length === 0) return null;

            const { FilePath, ContentType } = result.recordset[0];
            const fileBuffer = await fs.readFile(FilePath);
            return { base64: fileBuffer.toString('base64'), contentType: ContentType };

        } catch (error) {
            console.error('[Gallery] Error getting picture base64:', error);
            throw error;
        }
    }

    /**
     * Get categories used in an audit
     */
    async getCategories(auditId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('AuditID', sql.Int, auditId)
                .query(`
                    SELECT DISTINCT Category, COUNT(*) as Count
                    FROM AuditGalleryPictures
                    WHERE AuditID = @AuditID AND Category IS NOT NULL
                    GROUP BY Category ORDER BY Count DESC
                `);

            return result.recordset.map(r => ({ category: r.Category, count: r.Count }));

        } catch (error) {
            console.error('[Gallery] Error getting categories:', error);
            throw error;
        }
    }

    /**
     * Update picture metadata
     */
    async updatePicture(pictureId, updates) {
        try {
            const pool = await this.getPool();
            const allowedFields = ['Category', 'Caption'];
            const setClauses = [];
            const request = pool.request().input('PictureID', sql.Int, pictureId);

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    setClauses.push(`${key} = @${key}`);
                    request.input(key, sql.NVarChar, value);
                }
            }

            if (setClauses.length === 0) return false;

            await request.query(`UPDATE AuditGalleryPictures SET ${setClauses.join(', ')} WHERE PictureID = @PictureID`);
            return true;

        } catch (error) {
            console.error('[Gallery] Error updating picture:', error);
            throw error;
        }
    }

    /**
     * Get gallery stats for an audit
     */
    async getGalleryStats(auditId) {
        try {
            const pool = await this.getPool();
            const result = await pool.request()
                .input('AuditID', sql.Int, auditId)
                .query(`
                    SELECT 
                        COUNT(*) as TotalPictures,
                        ISNULL(SUM(FileSize), 0) as TotalSize,
                        COUNT(DISTINCT Category) as CategoryCount,
                        (SELECT COUNT(*) FROM AuditPictureAssignments a 
                         INNER JOIN AuditGalleryPictures p ON a.PictureID = p.PictureID 
                         WHERE p.AuditID = @AuditID) as TotalAssignments,
                        (SELECT COUNT(*) FROM AuditGalleryPictures WHERE AuditID = @AuditID 
                         AND PictureID NOT IN (SELECT DISTINCT PictureID FROM AuditPictureAssignments)) as UnassignedCount
                    FROM AuditGalleryPictures WHERE AuditID = @AuditID
                `);

            const stats = result.recordset[0];
            return {
                totalPictures: stats.TotalPictures || 0,
                totalSize: stats.TotalSize || 0,
                categoryCount: stats.CategoryCount || 0,
                totalAssignments: stats.TotalAssignments || 0,
                unassignedCount: stats.UnassignedCount || 0
            };

        } catch (error) {
            console.error('[Gallery] Error getting gallery stats:', error);
            throw error;
        }
    }

    /**
     * Get file extension from content type or filename
     */
    getExtension(contentType, fileName) {
        const types = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };
        if (contentType && types[contentType]) return types[contentType];
        if (fileName) {
            const ext = path.extname(fileName).toLowerCase();
            if (ext) return ext;
        }
        return '.jpg';
    }
}

module.exports = new GalleryService();
