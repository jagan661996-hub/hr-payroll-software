import { Router } from "express";
import { postLogin, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.post("/login", postLogin);
router.get("/me", authenticate, getMe);

export default router;
