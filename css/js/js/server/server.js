import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const {
  PORT = 3000,
  AI_API_KEY,
  AI_BASE_URL = "https://api.openai.com/v1/chat/completions",
  AI_MODEL = "gpt-4o-mini",
  ALLOWED_ORIGIN = "*", // isi dengan https://usernamekamu.github.io saat produksi
} = process.env;

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "200kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, max: 20 }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  if (!AI_API_KEY) return res.status(500).json({ error: "AI_API_KEY belum diisi di server." });
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) {
    return res.status(400).json({ error: "Format messages tidak valid." });
  }
  try {
    const upstream = await fetch(AI_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages }),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Gagal menghubungi penyedia AI." });
  }
});

app.listen(PORT, () => console.log(`Void Vusion API jalan di port ${PORT}`));
