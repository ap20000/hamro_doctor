import path from "path";
import extractPdf from "./extractPdf.js";
import extractTextFile from "./extractTextFile.js";
import openRouterVision from "../vision/openRouterVision.js";

/**
 * Extracts text from uploaded files based on file type.
 *
 * Supports PDF, TXT, and image formats.
 *
 * @param {Object} file - Uploaded file object from Multer.
 * @returns {Promise<string>} Extracted text content.
 */
async function extractText(file) {
    if (file.base64 && file.mimetype?.startsWith('image/')) {
        return openRouterVision(file);
    }

    if (!file.originalname) {
        throw new Error("Invalid file object provided for extraction");
    }

    const ext = path.extname(file.originalname).toLowerCase();

    switch (ext) {
        case ".pdf":
            return extractPdf(file.path);

        case ".txt":
            return extractTextFile(file.path);

        case ".jpg":
        case ".jpeg":
        case ".png":
        case ".webp":
        case ".gif":
            return openRouterVision(file);

        default:
            throw new Error("Unsupported file type");
    }
}

export default extractText;