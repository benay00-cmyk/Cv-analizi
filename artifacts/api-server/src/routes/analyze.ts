import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post("/analyze", async (req, res) => {
  const { ilan, cv, prompt } = req.body as { ilan?: string; cv?: string; prompt?: string };

  if (!prompt && (!ilan || !cv)) {
    res.status(400).json({ error: 'Provide either "prompt" or both "ilan" and "cv" fields.' });
    return;
  }

  const userMessage = prompt ?? `Job Posting (ilan):\n${ilan}\n\nCandidate CV:\n${cv}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: "You are an HR expert. Return ONLY valid JSON. No markdown. All strings single-line. Use Turkish.",
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    res.json({ result: message });
  } catch (err: unknown) {
    req.log.error({ err }, "Anthropic API call failed");
    const message =
      err instanceof Error ? err.message : "Anthropic API call failed";
    res.status(502).json({ error: message });
  }
});

export default router;
