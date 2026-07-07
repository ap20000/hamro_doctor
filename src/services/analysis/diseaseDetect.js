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

        const diseases = [];
        let current = null;

        for (const entity of entities) {
            const label = entity.entity_group || entity.label;

            if (!label?.includes("DISEASE")) {
                if (current) {
                    diseases.push(current);
                    current = null;
                }

                continue;
            }

            const word = entity.word.replace("##", "");

            if (!current) {
                current = {
                    disease: word,
                    confidence: entity.score,
                };

                continue;
            }

            current.disease += entity.word.startsWith("##")
                ? word
                : ` ${word}`;

            current.confidence = Math.min(
                current.confidence,
                entity.score
            );
        }

        if (current) {
            diseases.push(current);
        }

        return diseases;
    } catch (error) {
        console.error("Disease detection failed:", error);
        return [];
    }
}