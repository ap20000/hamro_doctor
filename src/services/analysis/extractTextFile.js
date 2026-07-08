import fs from "fs";

/**
 * Extracts text content from a plain text file.
 *
 * @param {string} filePath - Path to the text file.
 * @returns {Promise<string>} Text content from the file.
 */
async function extractTextFile(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

export default extractTextFile;