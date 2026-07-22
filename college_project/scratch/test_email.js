const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testSend() {
  try {
    console.log('Sending test verification code to juturuharshavardhan77@gmail.com...');
    const info = await transporter.sendMail({
      from: `"Nobody App" <${process.env.EMAIL_USER}>`,
      to: 'juturuharshavardhan77@gmail.com',
      replyTo: process.env.EMAIL_USER,
      subject: 'Your Nobody Account Verification Code',
      text: 'Your Nobody verification code is 892103. It expires in 5 minutes.',
    });
    console.log('✓ Sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ Error sending email via SMTP:', err);
  }
}

testSend();
