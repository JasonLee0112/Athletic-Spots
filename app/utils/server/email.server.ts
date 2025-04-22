// utils/server/email.server.ts
import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

const devTransporter = nodemailer.createTransport({
  host: "localhost", // Or the Docker host IP if not using localhost
  port: 1025,
  secure: false,
});

const hostSMTP = process.env.HOST_SMTP_ADDRESS?.toString();

const realTransporter = nodemailer.createTransport({
  host: hostSMTP, // Or the Docker host IP if not using localhost
  port: 1025,
  secure: false,
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Function to send an email
export async function sendEmail(options: EmailOptions) {
  const { to, subject, text, html } = options;
  try {
    const info = await devTransporter.sendMail({
      from: "noreply@athletic-spots.com",
      to,
      subject,
      html,
      text,
    });

    console.log("Email sent successfully!");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

// Utility to verify connection with Mailhog
export async function verifyMailConnection() {
  return new Promise((resolve, reject) => {
    devTransporter.verify((error) => {
      if (error) {
        console.error("Failed to connect to mail server:", error);
        reject(error);
      } else {
        console.log("Mail server connection established");
        resolve(true);
      }
    });
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
) {
  try {
    await verifyMailConnection();

    const resetLink = `${resetUrl}?token=${resetToken}`;

    const text = `Password Reset Request
    
    We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
    
    To reset your password, click this link: ${resetLink}
    
    This password reset link will expire in 24 hours.
    
    If you didn't request a password reset, please ignore this email or contact support if you have concerns.`;

    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4A90E2;">${resetLink}</p>
        <p>This password reset link will expire in 24 hours.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #777; font-size: 12px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>`;

    return sendEmail({
      to: email,
      subject: "Password Reset Request",
      text,
      html,
    });
  } catch (error) {
    console.error("Email test failed:", error);
  }
}
