import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user
      ? {
          user: env.smtp.user,
          pass: env.smtp.password,
        }
      : undefined,
  });

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!env.smtp.host || !env.smtp.user) {
    logger.warn(
      `SMTP is not configured; skipping email send to ${options.to} ("${options.subject}"). Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD in .env to enable email delivery.`
    );
    return;
  }

  const mailer = getTransporter();

  await mailer.sendMail({
    from: env.smtp.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  const subject = `${env.site.name} — Password Reset Request`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your ${env.site.name} account password. This link expires in 10 minutes.</p>
      <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Reset your ${env.site.name} password: ${resetUrl} (expires in 10 minutes). If you didn't request this, ignore this email.`;
  return { subject, html, text };
}

export function verificationEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  const subject = `Verify your ${env.site.name} account`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your email</h2>
      <p>Thanks for signing up for ${env.site.name}. Please confirm your email address to activate your account.</p>
      <p><a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
    </div>
  `;
  const text = `Verify your ${env.site.name} account: ${verifyUrl}`;
  return { subject, html, text };
}

export function newsletterConfirmEmail(confirmUrl: string): { subject: string; html: string; text: string } {
  const subject = `Confirm your subscription to ${env.site.name}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Confirm your subscription</h2>
      <p>You're one click away from getting the latest tech guides and reviews from ${env.site.name}.</p>
      <p><a href="${confirmUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Confirm Subscription</a></p>
    </div>
  `;
  const text = `Confirm your subscription to ${env.site.name}: ${confirmUrl}`;
  return { subject, html, text };
}
