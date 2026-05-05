import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('[Mailer] skipped sending email - credentials missing');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || '"Quick-Wash" <noreply@quickwash.com>',
      to,
      subject,
      html,
    });
    console.log('[Mailer] Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('[Mailer] Error sending email: ', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, code: string) => {
  const subject = 'Verify your Quick-Wash Account';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6d28d9;">Welcome to Quick-Wash!</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; background: #f3f4f6; padding: 10px 20px; border-radius: 8px; display: inline-block;">
        ${code}
      </div>
      <p>Use this code to verify your account and start your laundry revolution.</p>
      <p>Thank you,<br/>The Quick-Wash Team</p>
    </div>
  `;
  return sendEmail(email, subject, html);
};

export const sendOrderStatusEmail = async (email: string, orderId: string, status: string) => {
  const subject = `Update on your Order #${orderId}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2 style="color: #6d28d9;">Order Update</h2>
      <p>Your order <strong>#${orderId}</strong> status has changed to: <strong>${status}</strong></p>
      <p>Track your order live on the site for more details.</p>
      <p>Warm regards,<br/>Quick-Wash</p>
    </div>
  `;
  return sendEmail(email, subject, html);
};
