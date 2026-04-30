import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("Server Configuration Error: Telegram keys missing in Vercel environment.");
    return res.status(500).json({ error: "Configuration missing" }); // Script.js checks for 'configuration missing'
  }

  const text = [
    '[📩 Monish_Portfolio Contact Form]',
    '=================================',
    '',
    `Name: ${name || 'Anonymous'}`,
    `Email: ${email || 'No Email'}`,
    `Subject: ${subject || 'No Subject'}`,
    `Message: ${message || 'No Message'}`,
    '',
    '================================='
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text
      })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.description || "Telegram API Error");
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact Form error:", error);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
}
