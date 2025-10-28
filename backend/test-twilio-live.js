const twilio = require('twilio');
require('dotenv').config({ path: '/var/www/beautycita.com/.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

console.log('Twilio Config:');
console.log('- Account SID:', accountSid ? accountSid.substring(0, 10) + '...' : 'MISSING');
console.log('- Auth Token:', authToken ? '[PRESENT]' : 'MISSING');
console.log('- From Number:', fromNumber);
console.log('- Messaging Service SID:', messagingServiceSid);
console.log('');

if (!accountSid || !authToken) {
  console.error('❌ Twilio credentials missing!');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Test send to your phone
const testPhone = '+523221215551';
const testMessage = 'BeautyCita Test: Your verification code is 123456';

console.log('Sending test SMS to', testPhone);

client.messages
  .create({
    body: testMessage,
    messagingServiceSid: messagingServiceSid,
    to: testPhone
  })
  .then(message => {
    console.log('✅ SMS sent successfully!');
    console.log('- Message SID:', message.sid);
    console.log('- Status:', message.status);
    console.log('- To:', message.to);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ SMS failed:', error.message);
    console.error('- Error code:', error.code);
    console.error('- More info:', error.moreInfo);
    process.exit(1);
  });
