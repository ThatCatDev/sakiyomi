import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Get the SMTP transporter based on environment
 * - Local dev: Uses Mailpit on port 54325
 * - Production: Uses SMTP credentials from environment variables
 */
function getTransporter() {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    // Local development - use Mailpit SMTP
    return nodemailer.createTransport({
      host: 'localhost',
      port: 54325,
      secure: false,
    });
  }

  // Production - use environment variables
  const host = import.meta.env.SMTP_HOST;
  const port = parseInt(import.meta.env.SMTP_PORT || '587');
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getTransporter();

  const from = import.meta.env.DEV
    ? 'Sakiyomi <noreply@sakiyomi.local>'
    : import.meta.env.SMTP_FROM || 'Sakiyomi <noreply@sakiyomi.com>';

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/**
 * Team invitation email template
 */
export function getTeamInviteEmail(params: {
  teamName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const { teamName, inviterName, role, inviteUrl, siteUrl } = params;

  const subject = `You're invited to join ${teamName} on Sakiyomi`;

  const text = `
${inviterName} has invited you to join ${teamName} on Sakiyomi as a ${role}.

Accept your invitation: ${inviteUrl}

If you don't have an account yet, you'll be prompted to create one.

---
Sakiyomi - Planning Poker for Agile Teams
${siteUrl}
  `.trim();

  const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style type="text/css">
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.card { background-color: #ffffff; border-radius: 16px; padding: 40px; margin-top: 20px; }
.logo { text-align: center; padding: 20px 0; }
.logo img { width: 60px; height: 60px; }
h1 { color: #111827; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 8px 0; }
p { color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
.muted { color: #6b7280; }
.btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; }
.btn:hover { background-color: #4f46e5; }
.center { text-align: center; }
.footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 13px; }
.footer a { color: #6366f1; text-decoration: none; }
.team-badge { display: inline-block; background-color: #ede9fe; color: #6366f1; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; margin-bottom: 16px; }
</style>
</head>
<body>
<div class="container">
<div class="logo">
<img src="${siteUrl}/logo-email.png" alt="Sakiyomi" />
</div>
<div class="card">
<h1>You're Invited!</h1>
<p class="muted center" style="margin-bottom: 24px;">
${inviterName} has invited you to join their team
</p>
<div class="center">
<span class="team-badge">${teamName}</span>
</div>
<p class="center">
You've been invited to join as a <strong>${role}</strong>. Accept the invitation to start collaborating with your team on planning poker sessions.
</p>
<div class="center">
<a href="${inviteUrl}" class="btn">Accept Invitation</a>
</div>
<p class="muted center" style="font-size: 14px;">
If you don't have an account yet, you'll be prompted to create one.
</p>
</div>
<div class="footer">
<p>If you didn't expect this invitation, you can safely ignore this email.</p>
<p style="margin-top: 16px;">
<a href="${siteUrl}">Sakiyomi</a> - Planning Poker for Agile Teams
</p>
</div>
</div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
