const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // 1. Direct Gmail Service support (simplest setup: your gmail + 16-char app password)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    const cleanUser = process.env.GMAIL_USER.trim();
    const cleanPass = process.env.GMAIL_PASS.trim().replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });
    logger.info(`Email transporter initialized with Gmail service: ${cleanUser}`);
    return transporter;
  }

  // 2. Standard SMTP credentials (SendGrid, AWS SES, Brevo, Mailgun, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info(`Email transporter initialized with host: ${process.env.SMTP_HOST}`);
    return transporter;
  }

  // Fallback in development: Use Ethereal test account or local logging transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`Email transporter using Ethereal test account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    logger.warn(`Could not create Ethereal test account: ${err.message}. Using JSON stream fallback.`);
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }
};

/**
 * Builds the branded HTML email template for DermaScan AI
 */
const buildOtpEmailHtml = (otp, purpose = 'registration') => {
  const isRegistration = purpose === 'registration';
  const is2fa = purpose === '2fa';
  const heading = isRegistration 
    ? 'Verify Your Account' 
    : is2fa 
      ? 'Two-Factor Authentication' 
      : 'Reset Your Password';
  const subtitle = isRegistration
    ? 'Welcome to DermaScan AI. Please enter this verification code to activate your account.'
    : is2fa
      ? 'A sign-in request was detected for your DermaScan AI account. Use this security code to complete verification.'
      : 'We received a request to reset your password. Use the verification code below to proceed.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DermaScan AI Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0B132B;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0B132B;
      padding: 40px 0;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background: #111C35;
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      padding: 32px 24px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      margin: 0;
    }
    .brand-highlight {
      color: #06B6D4;
    }
    .content {
      padding: 32px 28px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #F8FAFC;
      margin: 0 0 12px;
    }
    .subtitle {
      font-size: 14px;
      color: #94A3B8;
      line-height: 1.6;
      margin: 0 0 28px;
    }
    .otp-card {
      background: #0B132B;
      border: 2px dashed #06B6D4;
      border-radius: 12px;
      padding: 20px;
      display: inline-block;
      margin: 0 auto 24px;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #06B6D4;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding-left: 10px;
    }
    .expiry-badge {
      display: inline-block;
      background: rgba(6, 182, 212, 0.12);
      color: #38BDF8;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      margin-bottom: 24px;
    }
    .notice {
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
      margin: 0 0 12px;
    }
    .footer {
      background: #0B132B;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">DermaScan <span class="brand-highlight">AI</span></h1>
      </div>
      <div class="content">
        <h2 class="title">${heading}</h2>
        <p class="subtitle">${subtitle}</p>
        
        <div class="otp-card">
          <div class="otp-code">${otp}</div>
        </div>
        
        <div>
          <span class="expiry-badge">⏱ This code expires in 10 minutes</span>
        </div>

        <p class="notice">
          For your security, never share this code with anyone. DermaScan AI support staff will never ask for your verification code.
        </p>
        <p class="notice">
          If you did not request this verification code, you can safely ignore this email.
        </p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} DermaScan AI. All rights reserved. Secure Medical Dermatology Portal.
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Sends a 6-digit verification code to the specified email
 */
const sendOtpEmail = async (toEmail, otp, purpose = 'registration') => {
  try {
    const mailTransporter = await getTransporter();
    const senderEmail = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : 'no-reply@dermascan.ai';
    const fromAddress = process.env.FROM_EMAIL || `"DermaScan AI" <${senderEmail}>`;
    const subject = purpose === 'registration'
      ? `${otp} is your DermaScan AI verification code`
      : purpose === '2fa'
        ? `${otp} is your DermaScan AI 2FA verification code`
        : `${otp} is your password reset code`;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject,
      text: `Your DermaScan AI verification code is: ${otp}. It expires in 10 minutes. If you did not request this code, please ignore this email.`,
      html: buildOtpEmailHtml(otp, purpose),
    };

    const info = await mailTransporter.sendMail(mailOptions);

    if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
      logger.info(`[EMAIL PREVIEW URL] ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      logger.info(`Verification email sent to ${toEmail}. Message ID: ${info.messageId || 'sent'}`);
    }

    // In development mode, log the preview for developer convenience
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`[DEV OTP NOTIFICATION]`);
      console.log(`To: ${toEmail}`);
      console.log(`OTP: ${otp}`);
      console.log(`Purpose: ${purpose}`);
      console.log(`========================================\n`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Error sending OTP email to ${toEmail}: ${error.message}`);
    // Return failure but do not crash the app
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
};
