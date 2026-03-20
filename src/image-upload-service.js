/**
 * Image Upload Service
 * Handles image compression and file storage for action plan pictures
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'action-plans');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class ImageUploadService {
    /**
     * Process and save an uploaded image
     * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
     * @param {string} documentNumber - Document number for organizing files
     * @param {string} referenceValue - Reference value of the action item
     * @returns {Promise<{success: boolean, filePath: string, url: string}>}
     */
    async saveImage(base64Data, documentNumber, referenceValue) {
        try {
            // Remove data URI prefix if present
            let base64 = base64Data;
            if (base64.includes(',')) {
                base64 = base64.split(',')[1];
            }
            
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(base64, 'base64');
            
            // Generate unique filename
            const hash = crypto.createHash('md5').update(base64).digest('hex').substring(0, 8);
            const timestamp = Date.now();
            const safeDocNum = documentNumber.replace(/[^a-zA-Z0-9-]/g, '_');
            const safeRef = referenceValue.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = `${safeDocNum}_${safeRef}_${timestamp}_${hash}.jpg`;
            
            // Create document-specific subdirectory
            const docDir = path.join(UPLOAD_DIR, safeDocNum);
            if (!fs.existsSync(docDir)) {
                fs.mkdirSync(docDir, { recursive: true });
            }
            
            const filePath = path.join(docDir, filename);
            
            // Compress and save image using sharp
            await sharp(imageBuffer)
                .resize(1200, 1200, { 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .jpeg({ 
                    quality: 75,
                    progressive: true
                })
                .toFile(filePath);
            
            // Get file size for logging
            const stats = fs.statSync(filePath);
            const originalSize = imageBuffer.length;
            const compressedSize = stats.size;
            const savings = Math.round((1 - compressedSize / originalSize) * 100);
            
            console.log(`📷 Image saved: ${filename} (${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB, ${savings}% smaller)`);
            
            // Return relative URL path
            const url = `/uploads/action-plans/${safeDocNum}/${filename}`;
            
            return {
                success: true,
                filePath: filePath,
                url: url,
                originalSize,
                compressedSize
            };
            
        } catch (error) {
            console.error('❌ Error saving image:', error);
            throw error;
        }
    }
    
    /**
     * Process multiple images
     * @param {string[]} base64Images - Array of base64 encoded images
     * @param {string} documentNumber - Document number
     * @param {string} referenceValue - Reference value
     * @returns {Promise<string[]>} Array of URLs
     */
    async saveImages(base64Images, documentNumber, referenceValue) {
        const urls = [];
        
        for (const base64 of base64Images) {
            // Skip if already a URL (not base64)
            if (base64.startsWith('/uploads/') || base64.startsWith('http')) {
                urls.push(base64);
                continue;
            }
            
            try {
                const result = await this.saveImage(base64, documentNumber, referenceValue);
                urls.push(result.url);
            } catch (error) {
                console.error('Error processing image:', error);
                // Skip failed images
            }
        }
        
        return urls;
    }
    
    /**
     * Delete an image file
     * @param {string} url - URL path of the image
     */
    deleteImage(url) {
        try {
            if (!url.startsWith('/uploads/')) return;
            
            const relativePath = url.replace('/uploads/action-plans/', '');
            const filePath = path.join(UPLOAD_DIR, relativePath);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted image: ${relativePath}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }
}

module.exports = new ImageUploadService();
