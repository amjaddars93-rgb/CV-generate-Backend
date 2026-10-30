import { Router } from "express";
import rateLimit from "express-rate-limit";
import requireAuth from "../middleware/auth.js";
import { createCV, listCVs, getCV, updateCV, deleteCV, generateCV } from "../controllers/cvController.js";

const router = Router();
const aiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });
router.use(requireAuth);
router.get("/", listCVs);
router.post("/", createCV);
router.post("/generate", aiLimiter, generateCV);
router.get("/:id", getCV);
router.patch("/:id", updateCV);
router.delete("/:id", deleteCV);
export default router;
