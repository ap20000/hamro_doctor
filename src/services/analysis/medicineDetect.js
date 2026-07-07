import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const MODEL = "OpenMed/OpenMed-NER-PharmaDetect-SuperClinical-434M";

/**
 * Detects medicine entities from medical text using a Hugging Face NER model.
 *
 * @param {string} text - Medical text to analyze.
 * @returns {Promise<Array<{medicine: string, confidence: number}>>}
 * Detected medicines with confidence scores.
 */
export default async function detectMedicines(text) {
    if (!text?.trim()) return [];

    try {
        const entities = await client.tokenClassification({
            model: MODEL,
            inputs: text,
            provider: "hf-inference",
        });

        if (!entities?.length) return [];

        const medicines = [];
        let current = null;

        for (const entity of entities) {
            const label = entity.entity_group || entity.label;

            if (!label?.includes("MEDICINE") && !label?.includes("DRUG")) {
                if (current) {
                    medicines.push(current);
                    current = null;
                }

                continue;
            }

            const word = entity.word.replace("##", "");

            if (!current) {
                current = {
                    medicine: word,
                    confidence: entity.score,
                };

                continue;
            }

            current.medicine += entity.word.startsWith("##")
                ? word
                : ` ${word}`;

            current.confidence = Math.min(
                current.confidence,
                entity.score
            );
        }

        if (current) {
            medicines.push(current);
        }

        return medicines;
    } catch (error) {
        console.error("Medicine detection failed:", error);
        return [];
    }
}