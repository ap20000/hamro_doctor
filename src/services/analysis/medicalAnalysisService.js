import extractText from './extractText.js';
import detectDiseases from './diseaseDetect.js';
import detectMedicines from './medicineDetect.js';
import { callLLM } from '../llmService.js';

const SYSTEM_INSTRUCTION = `
You are a helpful and compassionate AI Medical Assistant for the "Hamro Doctor" platform.
Your task is to take structured medical document analysis results (consisting of raw OCR text, detected diseases, and detected medicines) and generate a clear, patient-friendly, and educational explanation.

You must strictly adhere to the following rules:
1. Explain any detected medicines in simple, easy-to-understand language (what they are generally used for, common instructions).
2. Explain any detected diseases, symptoms, or medical conditions in plain language.
3. Decipher and explain any common medical abbreviations found in the text (e.g., DM -> Diabetes Mellitus, HTN -> Hypertension, BD -> Twice a day, OD -> Once a day, HS -> At bedtime, SOS -> As needed, etc.).
4. Summarize the prescription or document content in patient-friendly language.
5. Emphasize that the patient must follow the prescribing doctor's instructions.
6. Suggest that they consult a doctor or healthcare professional for any questions or if clarification is needed.

CRITICAL WARNINGS - YOU MUST NEVER:
- Diagnose new diseases or conditions.
- Prescribe any medications or suggest specific treatments.
- Recommend changes to dosages.
- Instruct patients to stop taking any prescribed medication.
- Replace professional medical advice. Always add a clear disclaimer that this explanation is for educational purposes only.

LANGUAGE INSTRUCTION:
- You MUST generate the entire explanation in English. Do not use Hindi or any other language, regardless of the patient's location or the text in the prescription.
`;

/**
 * Orchestrates OCR text extraction, OpenMed disease/medicine detection,
 * and calls the LLM service to generate a patient-friendly explanation.
 *
 * @param {Object} file - Multer file object.
 * @returns {Promise<Object>} Object containing extractedText, diseases, medicines, and explanation.
 */
export async function analyzeMedicalDocument(file) {
  // Step 1: Run unified text extraction (routes to OpenRouter Vision for images)
  console.log('[Vision] Starting extraction...');
  const extractedText = await extractText(file);
  console.log('[Vision] Extraction complete.');

  // Step 2 & 3: Run OpenMed services concurrently
  console.log('[OpenMed] Running disease detection...');
  console.log('[OpenMed] Running medicine detection...');
  const [diseases, medicines] = await Promise.all([
    detectDiseases(extractedText),
    detectMedicines(extractedText)
  ]);
  console.log('[OpenMed] Extraction completed.');

  // Step 4: Generate a natural explanation
  console.log('[LLM] Generating explanation...');
  const inputData = {
    ocrText: extractedText,
    diseases: diseases,
    medicines: medicines
  };

  const response = await callLLM({
    systemInstruction: SYSTEM_INSTRUCTION,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(inputData, null, 2)
      }
    ]
  });
  console.log('[LLM] Explanation generated successfully.');

  return {
    success: true,
    extractedText,
    diseases,
    medicines,
    explanation: response.text
  };
}
