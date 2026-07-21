import { Router, type IRouter } from "express";
import multer from "multer";
import mammoth from "mammoth";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.endsWith(".docx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx files are supported."));
    }
  },
});

router.post("/extract-cv", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Send a .docx file in the \"file\" field." });
    return;
  }

  try {
    const { value: text } = await mammoth.extractRawText({ buffer: req.file.buffer });
    res.json({ text });
  } catch (err: unknown) {
    req.log.error({ err }, "mammoth extraction failed");
    const message = err instanceof Error ? err.message : "Failed to extract text from file.";
    res.status(422).json({ error: message });
  }
});

export default router;
