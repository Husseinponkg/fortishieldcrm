const db = require("../config/db"); // your MySQL connection
const twilio = require("twilio");
require("dotenv").config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// Format phone number for Twilio
const formatPhoneNumber = (number) => {
  // Remove all non-digit characters except +
  let cleaned = number.replace(/[^\d+]/g, '');
  
  // If it starts with +, it's already in E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with 0, replace with country code (assuming Tanzania - +255)
  if (cleaned.startsWith('0')) {
    return '+255' + cleaned.substring(1);
  }
  
  // If it's 9 digits, assume it's a Tanzania number without country code
  if (cleaned.length === 9) {
    return '+255' + cleaned;
  }
  
  // If it's 10 digits and starts with 255, add +
  if (cleaned.length === 10 && cleaned.startsWith('255')) {
    return '+' + cleaned;
  }
  
  // If it's 12 digits and starts with 255, add +
  if (cleaned.length === 12 && cleaned.startsWith('255')) {
    return '+' + cleaned;
  }
  
  // Return as is if we can't format it
  return number;
};

// Send bulk SMS
const sendBulkSMS = async (req, res) => {
  try {
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({ success: false, message: "Request body is required" });
    }

    const { message, phone_numbers } = req.body;
    // We'll use the existing status field in the database which defaults to 'sent'

    // Log incoming request for debugging
    console.log("SMS Request Body:", req.body);
    console.log("Twilio SID:", process.env.TWILIO_SID ? "SET" : "NOT SET");
    console.log("Twilio Auth:", process.env.TWILIO_AUTH ? "SET" : "NOT SET");
    console.log("Twilio Phone:", process.env.TWILIO_PHONE);

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // phone_numbers is expected to be an array of strings
    if (!phone_numbers || !Array.isArray(phone_numbers)) {
      return res.status(400).json({ success: false, message: "phone_numbers must be an array" });
    }

    // Validate phone numbers
    if (phone_numbers.length === 0) {
      return res.status(400).json({ success: false, message: "At least one phone number is required" });
    }

    let results = [];
    let successfulSends = 0;
    let failedSends = 0;

    for (let number of phone_numbers) {
      try {
        // Validate phone number format (basic validation)
        if (!number || number.trim().length === 0) {
          results.push({ number, status: "failed", error: "Invalid phone number" });
          failedSends++;
          continue;
        }

        // Format phone number for Twilio
        const formattedNumber = formatPhoneNumber(number.trim());
        console.log(`Processing number: ${number} -> ${formattedNumber}`);

        // Validate E.164 format
        if (!formattedNumber.match(/^\+[1-9]\d{1,14}$/)) {
          const errorMsg = `Invalid E.164 format for number: ${formattedNumber}`;
          console.error(errorMsg);
          
          // Save failed attempt to DB
          await db.execute(
            "INSERT INTO sms (message, phone_numbers, status) VALUES (?, ?, ?)",
            [message, formattedNumber, "failed"]
          );
          
          results.push({
            number: formattedNumber,
            status: "failed",
            error: errorMsg
          });
          failedSends++;
          continue;
        }

        const response = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE,
          to: formattedNumber,
        });

        console.log("Twilio Response:", {
          sid: response.sid,
          status: response.status,
          errorCode: response.errorCode,
          errorMessage: response.errorMessage
        });

        // Save each SMS to DB
        // The status field in the database defaults to 'sent', and we're not collecting status from the frontend anymore
        await db.execute(
          "INSERT INTO sms (message, phone_numbers, status) VALUES (?, ?, ?)",
          [message, formattedNumber, "sent"]
        );

        results.push({ number: formattedNumber, status: "sent", sid: response.sid });
        successfulSends++;
      } catch (error) {
        console.error("Error sending to", number, error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          status: error.status,
          moreInfo: error.moreInfo
        });

        // Save failed attempt to DB
        await db.execute(
          "INSERT INTO sms (message, phone_numbers, status) VALUES (?, ?, ?)",
          [message, number.trim(), "failed"]
        );

        // Handle specific Twilio errors
        let errorMessage = error.message;
        let errorCode = error.code;
        
        // Common Twilio error codes
        if (error.code === 21211) {
          errorMessage = "Invalid 'To' phone number format";
        } else if (error.code === 21606) {
          errorMessage = "Invalid 'From' phone number (possibly not verified)";
        } else if (error.code === 20003) {
          errorMessage = "Authentication error - check Twilio credentials";
        } else if (error.code === 21408) {
          errorMessage = "Permission to send SMS not enabled";
        } else if (error.code === 21608) {
          errorMessage = "Trial account limitation: The recipient number is not verified. " +
                        "For trial accounts, you can only send messages to verified numbers. " +
                        "Please verify the recipient number in your Twilio console or upgrade your account.";
        }

        results.push({
          number: number.trim(),
          status: "failed",
          error: errorMessage,
          code: errorCode,
          moreInfo: error.moreInfo
        });
        failedSends++;
      }
    }

    res.status(200).json({
      success: true,
      message: `SMS sent: ${successfulSends} successful, ${failedSends} failed`,
      results
    });
  } catch (error) {
    console.error("Error in sendBulkSMS:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Fetch all SMS records
const getAllSMS = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM sms ORDER BY created_at DESC");
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error in getAllSMS:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { sendBulkSMS, getAllSMS };
