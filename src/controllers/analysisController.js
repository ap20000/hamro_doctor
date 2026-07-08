import fs from 'fs';
import extractText from '../services/analysis/extractText.js';
import detectDiseases from '../services/analysis/diseaseDetect.js';
import detectMedicines from '../services/analysis/medicineDetect.js';
import openRouterVision from '../services/vision/openRouterVision.js';
import { analyzeMedicalDocument } from '../services/analysis/medicalAnalysisService.js';

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

/**
 * Extracts text using OpenRouter Vision model.
 *
 * @route POST /api/v1/analysis/vision-ocr
 */
export const visionOcrController = async (req, res, next) => {
    try {
        if (!validateFile(req, res)) return;

        if (!req.file.mimetype.startsWith('image/')) {
            if (req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Vision OCR only supports image files.',
            });
        }

        const text = await openRouterVision(req.file);

        // Delete file after extraction to save disk space
        if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            extractedText: text,
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
 * Extracts text, runs OpenMed disease & medicine detection, and generates patient explanation.
 *
 * @route POST /api/v1/analysis/explain
 */
export const explainController = async (req, res, next) => {
    try {
        if (!validateFile(req, res)) return;

        const result = await analyzeMedicalDocument(req.file);

        // Delete file after extraction to save disk space
        if (req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            ocrText: result.extractedText,
            diseases: result.diseases,
            medicines: result.medicines,
            explanation: result.explanation
        });
    } catch (error) {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};
