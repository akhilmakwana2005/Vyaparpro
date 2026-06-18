import axios from 'axios';
import { logActivity } from './logger.js';

/**
 * Send an SMS using Fast2SMS API.
 * In a real production environment, you need an API key from https://www.fast2sms.com/
 * For now, if the key is missing, it will just log the SMS to the console.
 */
export const sendSMS = async (mobileNumber, message, req = null) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`\n================ SIMULATED SMS ================`);
    console.log(`To: ${mobileNumber}`);
    console.log(`Message: ${message}`);
    console.log(`===============================================\n`);
    
    if (req) {
      await logActivity(req, `Simulated SMS sent to ${mobileNumber}`, 'Communication', 'Fast2SMS API Key missing');
    }
    return { success: true, simulated: true };
  }

  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: apiKey,
        route: 'v3',
        sender_id: 'TXTIND', // Default sender ID
        message: message,
        language: 'english',
        flash: 0,
        numbers: mobileNumber,
      },
    });

    if (response.data && response.data.return) {
      if (req) {
        await logActivity(req, `SMS sent to ${mobileNumber}`, 'Communication', 'Successfully delivered');
      }
      return { success: true, data: response.data };
    } else {
      throw new Error('Fast2SMS failed to send message');
    }
  } catch (error) {
    console.error('Error sending SMS:', error.response?.data || error.message);
    if (req) {
      await logActivity(req, `SMS Failed to ${mobileNumber}`, 'Communication', error.message);
    }
    return { success: false, error: error.message };
  }
};
