const axios = require("axios");
require("dotenv").config();

// Test Beem Africa configuration
console.log("Testing Beem Africa Configuration...");
console.log("BEEM_API_KEY:", process.env.BEEM_API_KEY ? "SET" : "NOT SET");
console.log("BEEM_SECRET:", process.env.BEEM_SECRET ? "SET" : "NOT SET");
console.log("BEEM_SENDER_ID:", process.env.BEEM_SENDER_ID);

if (!process.env.BEEM_API_KEY || !process.env.BEEM_SECRET) {
  console.error("Beem Africa credentials are not set in environment variables");
  process.exit(1);
}

// Test phone number formatting function
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

// Test phone numbers
const testNumbers = [
  "+255712345678",
  "0712345678",
  "712345678",
  "255712345678"
];

console.log("\nTesting Phone Number Formatting:");
testNumbers.forEach(num => {
  console.log(`${num} -> ${formatPhoneNumber(num)}`);
});

// Test Beem Africa API connection
console.log("\nTesting Beem Africa API Connection...");
const testBeemConnection = async () => {
  try {
    // Test balance check endpoint
    const response = await axios.get('https://apisms.beem.africa/v1/balance', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${process.env.BEEM_API_KEY}:${process.env.BEM_SECRET}`).toString('base64')}`,
      },
    });
    
    console.log("Beem Africa API Connection Successful!");
    console.log("Account balance:", response.data.balance);
  } catch (error) {
    console.error("Beem Africa API Connection Failed:", error.message);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }
  }
};

testBeemConnection();