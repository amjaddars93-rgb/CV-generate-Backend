import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import requireAuth from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);
export default router;
