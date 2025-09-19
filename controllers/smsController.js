const axios = require('axios');
const db = require('../config/db');

async function sendSMS(req, res) {
  const { message, phone_numbers } = req.body;

  // Validate environment variables
  if (!process.env.BEEM_API_KEY || !process.env.BEEM_SECRET || !process.env.BEEM_SENDER_ID) {
    console.error('Missing Beem API credentials:', {
      BEEM_API_KEY: process.env.BEEM_API_KEY ? 'Present' : 'Missing',
      BEEM_SECRET: process.env.BEEM_SECRET ? 'Present' : 'Missing',
      BEEM_SENDER_ID: process.env.BEEM_SENDER_ID ? 'Present' : 'Missing'
    });
    return res.status(500).json({ success: false, error: 'Server configuration error: Missing Beem API credentials' });
  }

  try {
    const response = await axios.post(
      'https://apisms.beem.africa/v1/send',
      {
        source_addr: process.env.BEEM_SENDER_ID,
        schedule_time: '',
        encoding: '0',
        message,
        recipients: phone_numbers.map(num => ({ recipient_id: Math.floor(Math.random() * 100000), dest_addr: num }))
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${process.env.BEEM_API_KEY}:${process.env.BEEM_SECRET}`).toString('base64')}`,
        },
      }
    );

    console.log(`SMS sent successfully to ${phone_numbers.join(', ')}: ${JSON.stringify(response.data)}`);
    
    // Save SMS record to database
    try {
      const [result] = await db.execute(
        'INSERT INTO sms (message, phone_numbers, status) VALUES (?, ?, ?)',
        [message, phone_numbers.join(','), 'sent']
      );
      console.log(`SMS record saved to database with ID: ${result.insertId}`);
    } catch (dbError) {
      console.error('Error saving SMS record to database:', dbError);
    }
    
    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      results: response.data.recipients
    });
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`Beem API Error for ${phone_numbers.join(', ')}: ${errorMsg}`);
    
    // Save failed SMS record to database
    try {
      const [result] = await db.execute(
        'INSERT INTO sms (message, phone_numbers, status) VALUES (?, ?, ?)',
        [message, phone_numbers.join(','), 'failed']
      );
      console.log(`Failed SMS record saved to database with ID: ${result.insertId}`);
    } catch (dbError) {
      console.error('Error saving failed SMS record to database:', dbError);
    }
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: errorMsg
    });
  }
}

async function testSMS(req, res) {
  console.log('SMS test endpoint accessed');
  return res.status(200).json({ success: true, message: 'SMS route is working' });
}

module.exports = { sendSMS, testSMS };