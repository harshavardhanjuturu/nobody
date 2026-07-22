import nodemailer from 'nodemailer';

// Nodemailer transport setup using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const SENDER_EMAIL = process.env.EMAIL_USER || 'youseenobody1@gmail.com';
const SENDER_NAME = 'Nobody Verification';

export async function sendOTPEmail(toEmail: string, otp: string) {
  try {
    const plainText = `Your Nobody account verification code is: ${otp}\n\nThis verification code expires in 5 minutes. Do not share this code with anyone.\n\nNobody Collegiate Security.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="font-size: 24px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; color: #020617;">Nobody</h1>
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; margin-top: 4px; font-weight: 600;">Account Verification</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background-color: #f1f5f9; border-radius: 12px; text-align: center;">
                    <p style="font-size: 13px; color: #475569; margin: 0 0 12px 0; font-weight: 500;">Your login verification code is:</p>
                    <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #020617; font-family: monospace; background: #ffffff; padding: 14px 24px; border-radius: 8px; display: inline-block; border: 1px solid #cbd5e1; margin-bottom: 12px;">
                      ${otp}
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin: 0;">Expires in <strong>5 minutes</strong></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 24px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                    If you did not request this verification code, please ignore this email.<br>
                    Sent securely via ${SENDER_EMAIL}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: SENDER_EMAIL,
      subject: `Your Nobody Verification Code (${otp})`,
      text: plainText,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'Importance': 'high',
        'X-MSMail-Priority': 'High',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      },
    });

    console.log(`[EMAIL] High-priority OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send OTP to ${toEmail}:`, error);
    return { success: false, error: error.message || 'Failed to send OTP email via SMTP' };
  }
}

export async function sendNotificationEmail(
  toEmail: string,
  subject: string,
  title: string,
  bodyText: string,
  actionUrl?: string
) {
  if (!toEmail || !toEmail.includes('@')) return { success: false, error: 'Invalid recipient email' };

  try {
    const plainText = `${title}\n\n${bodyText}\n\nView in App: ${actionUrl || 'http://localhost:3000'}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="font-size: 24px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; color: #020617;">Nobody</h1>
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #64748b; margin-top: 4px; font-weight: 600;">Platform Notification</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #f1f5f9; border-radius: 12px;">
                    <h2 style="font-size: 16px; font-weight: 700; color: #020617; margin: 0 0 10px 0;">${title}</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0;">${bodyText}</p>
                    ${
                      actionUrl
                        ? `<div style="margin-top: 20px; text-align: center;">
                            <a href="${actionUrl}" style="background-color: #020617; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 22px; border-radius: 8px; display: inline-block;">View in App →</a>
                          </div>`
                        : ''
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
                    Sent via ${SENDER_EMAIL} • Nobody Campus Portal
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: toEmail,
      replyTo: SENDER_EMAIL,
      subject: subject,
      text: plainText,
      html: htmlContent,
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'Importance': 'high',
      },
    });

    console.log(`[EMAIL] Notification sent to ${toEmail}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send notification email to ${toEmail}:`, error);
    return { success: false, error: error.message || 'Failed to send notification email' };
  }
}
