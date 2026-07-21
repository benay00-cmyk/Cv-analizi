import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import extractCvRouter from "./extract-cv";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(extractCvRouter);

export default router;
