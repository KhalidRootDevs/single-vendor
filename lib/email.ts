import nodemailer from 'nodemailer';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM = process.env.SMTP_FROM || 'noreply@yourstore.com';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function baseLayout(content: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      ${content}
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#999;font-size:12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (error) {
    console.error(`Failed to send email [${subject}] to ${to}:`, error);
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  password: string
): Promise<void> {
  await send(
    email,
    'Welcome to Our Store – Your Account Details',
    baseLayout(`
      <h2>Welcome to Our Store, ${name}!</h2>
      <p>Thank you for your order! We've created an account so you can track orders and manage future purchases.</p>
      <div style="background:#f5f5f5;padding:15px;border-radius:5px;margin:20px 0;">
        <p><strong>Your Login Details:</strong></p>
        <p>Email: <strong>${email}</strong></p>
        <p>Password: <strong>${password}</strong></p>
      </div>
      <p style="color:#666;">For security, we recommend changing your password after first login.</p>
      <p>
        <a href="${APP_URL}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">
          Visit Store
        </a>
      </p>
    `)
  );
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await send(
    email,
    'Verify your email address',
    baseLayout(`
      <h2>Hi ${name}, please verify your email</h2>
      <p>Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">
          Verify Email
        </a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link into your browser:<br>${url}</p>
    `)
  );
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(
    email,
    'Reset your password',
    baseLayout(`
      <h2>Hi ${name}, reset your password</h2>
      <p>We received a request to reset the password for your account. Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p style="color:#666;font-size:13px;">Or copy this link into your browser:<br>${url}</p>
      <p style="color:#999;font-size:12px;">If you didn't request a password reset, you can safely ignore this email.</p>
    `)
  );
}
