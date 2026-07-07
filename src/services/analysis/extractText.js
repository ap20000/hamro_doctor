import path from "path";
import extractPdf from "./extractPdf.js";
import extractImage from "./extractImage.js";
import extractTextFile from "./extractTextFile.js";

/**
 * Extracts text from uploaded files based on file type.
 *
 * Supports PDF, TXT, and image formats.
 *
 * @param {Object} file - Uploaded file object from Multer.
 * @returns {Promise<string>} Extracted text content.
 */
async function extractText(file) {
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
            return extractImage(file.path);

        default:
            throw new Error("Unsupported file type");
    }
}

export default extractText;