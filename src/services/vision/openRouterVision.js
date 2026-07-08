import fs from 'fs';
import axios from 'axios';

/**
 * Sends an uploaded image file to OpenRouter's vision API to transcribe its text.
 *
 * @param {Object} file - Multer file object containing path and mimetype.
 * @returns {Promise<string>} Transcribed text from the image.
 */
export default async function openRouterVision(file) {
  if (!file || !file.path) {
    throw new Error('Invalid file object provided for vision OCR.');
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in the environment config.');
  }

  const model = process.env.OPENROUTER_VISION_MODEL || 'google/gemma-4-31b-it';
  const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

  // Read the file and convert to base64
  const buffer = fs.readFileSync(file.path);
  const base64Image = buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are a medical OCR engine. Transcribe all text in this image accurately, including drug names, dosages, frequencies, patient info, and clinical notes. Return ONLY the transcribed text. Do not write any introduction, commentary, formatting tags, or explanations.'
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(openRouterUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const text = response.data.choices?.[0]?.message?.content || '';
    return text.trim();
  } catch (error) {
    if (error.response) {
      console.error('OpenRouter Vision API Error:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`OpenRouter Vision API failed: ${error.response.data.error?.message || error.message}`);
    }
    throw error;
  }
}

