import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root (artifacts/api-server/)
const projectRoot = path.resolve(process.cwd());
app.use(express.static(projectRoot));

// Explicit fallback so GET / always returns index.html
app.get("/", (_req, res) => {
  res.sendFile(path.join(projectRoot, "index.html"));
});

app.use("/api", router);

export default app;
