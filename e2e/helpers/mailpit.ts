/**
 * Mailpit email testing helper
 * Use with `supabase start` which includes Mailpit on port 54324
 */

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:54324';

interface MailpitMessage {
  ID: string;
  From: { Address: string; Name: string };
  To: { Address: string; Name: string }[];
  Subject: string;
  Date: string;
  Size: number;
}

interface MailpitMessageList {
  messages: MailpitMessage[];
  total: number;
}

interface MailpitMessageBody {
  ID: string;
  From: { Address: string; Name: string };
  To: { Address: string; Name: string }[];
  Subject: string;
  Date: string;
  Text: string;
  HTML: string;
}

export async function getEmails(email?: string): Promise<MailpitMessage[]> {
  const url = email
    ? `${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`
    : `${MAILPIT_URL}/api/v1/messages`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data: MailpitMessageList = await response.json();
  return data.messages || [];
}

export async function getEmail(messageId: string): Promise<MailpitMessageBody> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  return response.json();
}

export async function getLatestEmail(email?: string): Promise<MailpitMessageBody | null> {
  const messages = await getEmails(email);
  if (messages.length === 0) return null;
  const sorted = messages.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
  return getEmail(sorted[0].ID);
}

export async function waitForEmail(
  email: string,
  options: { timeout?: number; interval?: number; subject?: string } = {}
): Promise<MailpitMessageBody> {
  const { timeout = 30000, interval = 500, subject } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const messages = await getEmails(email);
    if (messages.length > 0) {
      if (subject) {
        const matching = messages.find(m => m.Subject.toLowerCase().includes(subject.toLowerCase()));
        if (matching) return getEmail(matching.ID);
      } else {
        const sorted = messages.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
        return getEmail(sorted[0].ID);
      }
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for email to ${email}`);
}

export function extractVerificationLink(emailBody: MailpitMessageBody): string | null {
  const html = emailBody.HTML || emailBody.Text;
  const patterns = [
    /href="([^"]*token=[^"]*)"/i,
    /href="([^"]*confirm[^"]*)"/i,
    /(https?:\/\/[^\s<>"]*token=[^\s<>"]*)/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      // Decode HTML entities like &amp; -> &
      // Replace 127.0.0.1 with localhost for Playwright browser compatibility
      return match[1].replace(/&amp;/g, '&').replace('127.0.0.1', 'localhost');
    }
  }
  return null;
}

export async function deleteAllEmails(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' }).catch(() => {});
}
