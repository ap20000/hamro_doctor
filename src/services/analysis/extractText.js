import path from "path";
import openRouterVision from "../vision/openRouterVision.js";

/**
 * Extracts text from uploaded files based on file type.
 *
 * Supports image formats only.
 *
 * @param {Object} file - Uploaded file object from Multer.
 * @returns {Promise<string>} Extracted text content.
 */
async function extractText(file) {
    if (file.base64 && file.mimetype?.startsWith('image/')) {
        return openRouterVision(file);
    }

    if (!file.originalname && !file.mimetype) {
        throw new Error("Invalid file object provided for extraction");
    }

    if (file.mimetype && file.mimetype.startsWith('image/')) {
        return openRouterVision(file);
    }

    if (file.originalname) {
        const ext = path.extname(file.originalname).toLowerCase();

        switch (ext) {
            case ".jpg":
            case ".jpeg":
            case ".png":
            case ".webp":
            case ".gif":
                return openRouterVision(file);

            default:
                throw new Error("Unsupported file type: only image files (JPG, PNG, WEBP, GIF) are allowed for text extraction.");
        }
    }

    throw new Error("Unsupported file type: only image files are allowed.");
}

export default extractText;