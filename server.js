// server.js — single-file CV analysis API server
// Run with: node server.js
// Requires: npm install express cors multer mammoth @anthropic-ai/sdk

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mammoth = require("mammoth");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");

// ─── Config ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY environment variable is required.");
  process.exit(1);
}

// ─── Setup ─────────────────────────────────────────────────────────────────

const app = express();
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html and static assets from the same directory as this file
app.use(express.static(path.join(__dirname, "src")));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "src", "index.html")));

// ─── Multer (file uploads) ──────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    const isDocx =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.endsWith(".docx");
    isDocx ? cb(null, true) : cb(new Error("Only .docx files are supported."));
  },
});

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// CV analysis via Claude
app.post("/api/analyze", async (req, res) => {
  const { ilan, cv, prompt } = req.body;

  if (!prompt && (!ilan || !cv)) {
    return res
      .status(400)
      .json({ error: 'Provide either "prompt" or both "ilan" and "cv" fields.' });
  }

  const userMessage =
    prompt ?? `Job Posting (ilan):\n${ilan}\n\nCandidate CV:\n${cv}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system:
        "You are an HR expert. Return ONLY valid JSON. No markdown. All strings single-line. Use Turkish.",
      messages: [{ role: "user", content: userMessage }],
    });

    res.json({ result: message });
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(502).json({ error: err.message || "Anthropic API call failed" });
  }
});

// Extract text from a .docx upload
app.post("/api/extract-cv", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: 'No file uploaded. Send a .docx file in the "file" field.' });
  }

  try {
    const { value: text } = await mammoth.extractRawText({
      buffer: req.file.buffer,
    });
    res.json({ text });
  } catch (err) {
    console.error("mammoth extraction error:", err);
    res
      .status(422)
      .json({ error: err.message || "Failed to extract text from file." });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
