import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (options) => {
  // If no EmailJS credentials exist, fallback to logging
  if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
    console.log('===================================================');
    console.log(`MOCK EMAIL SENT TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`CONTENT: ${options.html}`);
    console.log('===================================================');
    return;
  }

  const data = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY, // Optional, depending on your EmailJS security settings
    template_params: {
      to_email: options.to,
      subject: options.subject,
      message_html: options.html,
    },
  };

  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data);
    console.log('EmailJS Response:', response.data);
  } catch (error) {
    console.error('===================================================');
    console.error('EMAILJS ERROR: Failed to send email through EmailJS.');
    console.error(`Here is the email that tried to send to ${options.to}:`);
    console.error(`SUBJECT: ${options.subject}`);
    console.error(`CONTENT: ${options.html}`);
    console.error('===================================================');
    console.error('Original Error:', error.response?.data || error.message);
    throw new Error('EmailJS Error: ' + (error.response?.data || error.message));
  }
};

export default sendEmail;
