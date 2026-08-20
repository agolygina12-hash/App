import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { generateAdvice } from "../advice/engine.js";

export const adviceRouter = Router();
adviceRouter.use(requireAuth);

adviceRouter.get("/", (req: AuthedRequest, res) => {
  res.json({ tips: generateAdvice(req.userId!) });
});
