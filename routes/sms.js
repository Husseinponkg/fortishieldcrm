const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");
const twilio = require("twilio");
require("dotenv").config();

// Test Twilio configuration endpoint
router.get("/test", async (req, res) => {
  try {
    // Check if Twilio credentials are set
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH) {
      return res.status(500).json({
        success: false,
        message: "Twilio credentials not set in environment variables"
      });
    }

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    
    // Test connection by fetching recent messages
    const messages = await client.messages.list({limit: 1});
    
    res.status(200).json({
      success: true,
      message: "Twilio connection successful",
      recentMessages: messages.length
    });
  } catch (error) {
    console.error("Twilio test error:", error);
    res.status(500).json({
      success: false,
      message: "Twilio connection failed",
      error: error.message
    });
  }
});

router.post("/send", smsController.sendBulkSMS);
router.get("/", smsController.getAllSMS);

module.exports = router;
