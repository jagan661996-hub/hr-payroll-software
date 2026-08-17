import { Router } from "express";
import { getMeta } from "../controllers/meta.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/", getMeta);

export default router;
