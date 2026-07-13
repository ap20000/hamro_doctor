import { pipeline, env } from '@huggingface/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
env.allowRemoteModels = false;
env.localModelPath = path.resolve(__dirname, '../../../public/onnx_model');

let extractor = null;

async function getExtractor() {
    if (!extractor) {
        extractor = await pipeline('token-classification', 'PharmaDetect', {
            quantized: false,
            local_files_only: true
        });
    }
    return extractor;
}

/**
 * Detects medicine entities from medical text using a local Hugging Face NER model.
 * Uses manual token aggregation to match the remote Inference API exactly.
 *
 * @param {string} text - Medical text to analyze.
 * @returns {Promise<Array<{medicine: string, confidence: number}>>}
 * Detected medicines with confidence scores.
 */
export default async function detectMedicines(text) {
    if (!text?.trim()) return [];

    try {
        const detect = await getExtractor();
        
        // Removed { aggregation_strategy: "simple" } to get raw subword tokens,
        // matching the raw input the interface model receives.
        const entities = await detect(text);

        if (!entities?.length) return [];

        const rawResults = [];
        let current = null;

        // Manual aggregation loop matching the Interface API
        for (const entity of entities) {
            const label = entity.entity_group || entity.label || entity.entity;

            // Only process medicine labels
            if (!label?.includes("MEDICINE") && !label?.includes("DRUG") && !label?.includes("CHEM")) {
                continue;
            }

            if (!current) {
                current = {
                    word: entity.word.replace("##", ""),
                    confidence: [entity.score],
                    lastIndex: entity.index
                };
                continue;
            }

            const isConsecutive = entity.index === current.lastIndex + 1;
            const isSubword = entity.word.startsWith("##");

            if (isConsecutive) {
                if (isSubword) {
                    current.word += entity.word.replace("##", "");
                } else {
                    current.word += " " + entity.word;
                }
                current.confidence.push(entity.score);
                current.lastIndex = entity.index;
            } else {
                rawResults.push({
                    medicine: current.word,
                    confidence: current.confidence.reduce((a, b) => a + b, 0) / current.confidence.length,
                });

                current = {
                    word: entity.word.replace("##", ""),
                    confidence: [entity.score],
                    lastIndex: entity.index
                };
            }
        }

        // Push the final entity if it exists
        if (current) {
            rawResults.push({
                medicine: current.word,
                confidence: current.confidence.reduce((a, b) => a + b, 0) / current.confidence.length,
            });
        }

        // Deduplicate and filter out empty/single-char results
        const medicines = [];
        const seen = new Set();
        
        for (const item of rawResults) {
            const lower = item.medicine.toLowerCase();
            if (!seen.has(lower) && lower.length > 1) {
                seen.add(lower);
                
                // Format decimal to 2 places for cleaner output
                item.confidence = parseFloat(item.confidence.toFixed(2));
                medicines.push(item);
            }
        }

        console.log(`[Medicine NER] Reconstructed ${medicines.length} distinct medicines.`);
        return medicines;
    } catch (error) {
        console.error("Medicine detection failed:", error);
        return [];
    }
}