import Tesseract from "tesseract.js";

/**
 * Extracts text from an image using OCR.
 *
 * @param {string} filePath - Path to the image file.
 * @returns {Promise<string>} Extracted text from the image.
 */
async function extractImage(filePath) {
    const result = await Tesseract.recognize(filePath, "eng");

    return result.data.text;
}

export default extractImage;