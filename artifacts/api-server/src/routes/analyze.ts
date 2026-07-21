import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post("/analyze", async (req, res) => {
  const { ilan, cv } = req.body as { ilan?: string; cv?: string };

  if (!ilan || !cv) {
    res.status(400).json({ error: 'Both "ilan" and "cv" fields are required.' });
    return;
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Job Posting (ilan):\n${ilan}\n\nCandidate CV:\n${cv}`,
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
