import fs from "fs";
import pkg from "pdf-parse/lib/pdf-parse.js";

/**
 * Extracts text from a PDF document.
 *
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} Extracted text from the PDF.
 */
async function extractPdf(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pkg(buffer);

    return data.text;
}

export default extractPdf;