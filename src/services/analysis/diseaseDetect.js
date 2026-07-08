import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const MODEL = "OpenMed/OpenMed-NER-DiseaseDetect-BioMed-335M";

/**
 * Detects disease entities from medical text using a Hugging Face NER model.
 *
 * @param {string} text - Medical text to analyze.
 * @returns {Promise<Array<{disease: string, confidence: number}>>} 
 * Detected diseases with confidence scores.
 */
export default async function detectDiseases(text) {
    if (!text?.trim()) return [];

    try {
        const entities = await client.tokenClassification({
            model: MODEL,
            inputs: text,
            provider: "hf-inference",
        });

        if (!entities?.length) return [];

        const rawResults = [];
        let current = null;

        for (const entity of entities) {
            const label = entity.entity_group || entity.label;

            // Only process disease labels
            if (!label?.includes("DISEASE")) {
                continue;
            }

            if (!current) {
                current = {
                    start: entity.start,
                    end: entity.end,
                    confidence: [entity.score],
                };
                continue;
            }

            // Check if contiguous (subwords) or separated by a single space (adjacent words)
            const isSubword = entity.word.startsWith("##") || entity.start === current.end;
            const isAdjacentWord = entity.start === current.end + 1 && text[current.end] === ' ';

            if (isSubword || isAdjacentWord) {
                // Merge into current entity
                current.end = entity.end;
                current.confidence.push(entity.score);
            } else {
                // Save current and start a new entity
                rawResults.push({
                    disease: text.substring(current.start, current.end).trim(),
                    confidence: current.confidence.reduce((a, b) => a + b, 0) / current.confidence.length,
                });

                current = {
                    start: entity.start,
                    end: entity.end,
                    confidence: [entity.score],
                };
            }
        }

        // Push the final entity if it exists
        if (current) {
            rawResults.push({
                disease: text.substring(current.start, current.end).trim(),
                confidence: current.confidence.reduce((a, b) => a + b, 0) / current.confidence.length,
            });
        }

        // Deduplicate and filter out empty/single-char results
        const diseases = [];
        const seen = new Set();
        
        for (const item of rawResults) {
            const lower = item.disease.toLowerCase();
            if (!seen.has(lower) && lower.length > 1) {
                seen.add(lower);
                
                // Format decimal to 2 places for cleaner output
                item.confidence = parseFloat(item.confidence.toFixed(2));
                diseases.push(item);
            }
        }

        console.log(`[Disease NER] Reconstructed ${diseases.length} distinct diseases.`);
        return diseases;
    } catch (error) {
        console.error("Disease detection failed:", error);
        return [];
    }
}