const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { sendSMS, testSMS } = require('../controllers/smsController');

router.post(
  '/send',
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('phone_numbers').isArray({ min: 1 }).withMessage('At least one phone number is required'),
    body('phone_numbers.*')
      .matches(/^\+\d{10,15}$/).withMessage('Invalid phone number format. Use E.164 format (e.g., +255xxxxxxxx with 8-9 digits after +255)')
      .custom((value) => {
        if (value.startsWith('+255') && (value.length !== 12 && value.length !== 13)) {
          throw new Error('Tanzania numbers must be 12-13 characters long (e.g., +255xxxxxxxx with 8-9 digits after +255)');
        }
        return true;
      })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Validation errors: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    console.log(`POST /sms/send accessed with payload: ${JSON.stringify(req.body)}`);
    next();
  },
  sendSMS
);

router.get('/test', (req, res, next) => {
  console.log('GET /sms/test accessed');
  next();
}, testSMS);

module.exports = router;