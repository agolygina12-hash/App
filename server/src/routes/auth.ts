import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, STARTING_CASH } from "../db/index.js";
import { requireAuth, signToken, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  const user = db
    .prepare("SELECT id, username, email, cash FROM users WHERE id = ?")
    .get(req.userId) as { id: number; username: string; email: string; cash: number } | undefined;
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

const registerSchema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, underscore only"),
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
});

authRouter.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { username, email, password } = parsed.data;

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (existing) {
    return res.status(409).json({ error: "Username or email already taken" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (username, email, password_hash, cash) VALUES (?, ?, ?, ?)")
    .run(username, email, passwordHash, STARTING_CASH);

  const token = signToken(Number(info.lastInsertRowid), username);
  res.status(201).json({
    token,
    user: { id: info.lastInsertRowid, username, email, cash: STARTING_CASH },
  });
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { username, password } = parsed.data;

  const user = db
    .prepare("SELECT id, username, email, password_hash, cash FROM users WHERE username = ? OR email = ?")
    .get(username, username) as
    | { id: number; username: string; email: string; password_hash: string; cash: number }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = signToken(user.id, user.username);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, cash: user.cash },
  });
});
