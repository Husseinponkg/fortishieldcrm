const twilio = require("twilio");
require("dotenv").config();

// Test Twilio configuration
console.log("Testing Twilio Configuration...");
console.log("Twilio SID:", process.env.TWILIO_SID ? "SET" : "NOT SET");
console.log("Twilio Auth:", process.env.TWILIO_AUTH ? "SET" : "NOT SET");
console.log("Twilio Phone:", process.env.TWILIO_PHONE);

if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH) {
  console.error("Twilio credentials are not set in environment variables");
  process.exit(1);
}

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

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

// Test Twilio API connection
console.log("\nTesting Twilio API Connection...");
client.messages.list({limit: 1})
  .then(messages => {
    console.log("Twilio API Connection Successful!");
    console.log(`Found ${messages.length} recent messages`);
  })
  .catch(error => {
    console.error("Twilio API Connection Failed:", error.message);
    console.error("Error code:", error.code);
    console.error("Error status:", error.status);
  });