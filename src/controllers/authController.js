import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { registerSchema, loginSchema } from "../validators/authValidators.js";

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    algorithm: "HS256"
  });
}
function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}
export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid registration details", errors: parsed.error.flatten() });
    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "Email is already registered" });
    const user = await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12) });
    return res.status(201).json({ success: true, data: { user: safeUser(user), token: issueToken(user) } });
  } catch (err) { next(err); }
}
export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid login details" });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect" });
    }
    return res.json({ success: true, data: { user: safeUser(user), token: issueToken(user) } });
  } catch (err) { next(err); }
}
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("name email");
    if (!user) return res.status(401).json({ success: false, message: "User no longer exists" });
    return res.json({ success: true, data: { user: safeUser(user) } });
  } catch (err) { next(err); }
}
