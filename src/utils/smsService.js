import axios from 'axios';

/**
 * Send SMS using Aakash SMS API
 * @param {string} to - Receiver phone number
 * @param {string} text - Message content
 */
export const sendSMS = async (to, text) => {
  try {
    // Sanitize number: remove any non-digit characters and trim prefixes
    let sanitizedNumber = to.replace(/\D/g, '');
    
    // If it starts with 977, remove it
    if (sanitizedNumber.startsWith('977') && sanitizedNumber.length > 10) {
      sanitizedNumber = sanitizedNumber.substring(3);
    }
    
    // If it starts with 0, remove it
    if (sanitizedNumber.startsWith('0') && sanitizedNumber.length > 10) {
      sanitizedNumber = sanitizedNumber.substring(1);
    }

    // Aakash SMS expects 10 digits
    if (sanitizedNumber.length !== 10) {
      console.warn(`Warning: Sanitized number length is ${sanitizedNumber.length}. Aakash SMS expects 10 digits.`);
    }

    const response = await axios.post(process.env.SMS_API_URL, {
      auth_token: process.env.SMS_API_KEY,
      to: sanitizedNumber,
      text: text,
    });

    console.log('SMS Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error.response?.data || error.message);
    // In production, you might not want to throw to avoid breaking the registration flow
    // but for now, we'll log it.
    return null;
  }
};
