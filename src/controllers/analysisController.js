import fs from 'fs';
import extractText from '../services/analysis/extractText.js';
import detectDiseases from '../services/analysis/diseaseDetect.js';
import detectMedicines from '../services/analysis/medicineDetect.js';

/**
 * Validates uploaded file presence.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {boolean} True if file exists, otherwise sends 400 response.
 */
const validateFile = (req, res) => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'No file uploaded or invalid file format.',
        });
        return false;
    }
    return true;
};

/**
 * Extracts text from an uploaded document or image.
 * 
 * @route POST /api/v1/analysis/ocr
 */
export const extractTextController = async (req, res, next) => {
    try {
        if (!validateFile(req, res)) return;

        // User context is available at req.user._id (from protect middleware)
        const userId = req.user._id;

        const text = await extractText(req.file);

        // Delete file after extraction to save disk space
        if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (!text) {
            return res.status(204).json({
                success: true,
                message: 'No text extracted from the file.',
            });
        }

        res.status(200).json({
            success: true,
            extractedText: text,
            user: userId
        });
    } catch (error) {
        // Ensure file is deleted even if error occurs
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

/**
 * Extracts text and detects diseases and medicines.
 *
 * @route POST /api/v1/analysis/detect
 */
export const detectController = async (req, res, next) => {
    try {
        if (!validateFile(req, res)) return;

        const userId = req.user._id;

        const text = await extractText(req.file);

        // Delete file after extraction
        if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const [diseaseResult, medicineResult] = await Promise.all([
            detectDiseases(text),
            detectMedicines(text),
        ]);

        if (!diseaseResult.length && !medicineResult.length) {
            return res.status(204).json({
                success: true,
                message: 'No diseases or medicines detected.',
            });
        }

        res.status(200).json({
            success: true,
            diseaseResult,
            medicineResult,
            user: userId
        });
    } catch (error) {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};
