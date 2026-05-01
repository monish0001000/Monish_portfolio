import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the first proxy in front of the app (e.g. Nginx, Load Balancer)
  // This is required for express-rate-limit to correctly identify the client IP
  app.set("trust proxy", 1);

  // Security Middleware
  app.use(express.json());
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles this in dev
  }));

  // Rate Limiting for API routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs for the contact form
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // API Route: Contact Form
  app.post("/api/contact", apiLimiter, async (req, res) => {
    const { name, email, subject, message } = req.body;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Server Configuration Error: Telegram keys missing");
      return res.status(500).json({ error: "Server configuration error" });
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const imagesPath = path.join(process.cwd(), 'images');
    
    // Serve the original images folder statically so PDF resume and unbundled assets are available
    app.use('/images', express.static(imagesPath));
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Security-hardened server running on http://localhost:${PORT}`);
  });
}

startServer();
