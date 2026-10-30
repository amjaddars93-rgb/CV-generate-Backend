import CV from "../models/CV.js";
import { cvSchema, generateSchema } from "../validators/cvValidators.js";

// Content sections the AI is allowed to polish. Photo, colours, template and section titles are never sent to or changed by the AI.
const CONTENT_KEYS = ["personalInfo", "education", "experience", "skills", "projects", "certifications", "languages", "achievements", "volunteerExperience", "interests", "customSections"];

function plainCV(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  return obj;
}
export async function createCV(req, res, next) {
  try {
    const parsed = cvSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid CV fields", errors: parsed.error.flatten() });
    const cv = await CV.create({ ...parsed.data, user: req.userId, title: parsed.data.title || "My CV" });
    res.status(201).json({ success: true, data: { cv: plainCV(cv) } });
  } catch (err) { next(err); }
}
export async function listCVs(req, res, next) {
  try {
    const cvs = await CV.find({ user: req.userId }).sort({ updatedAt: -1 }).select("-__v");
    res.json({ success: true, data: { cvs } });
  } catch (err) { next(err); }
}
export async function getCV(req, res, next) {
  try {
    const cv = await CV.findOne({ _id: req.params.id, user: req.userId }).select("-__v");
    if (!cv) return res.status(404).json({ success: false, message: "CV not found" });
    res.json({ success: true, data: { cv } });
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ success: false, message: "CV not found" });
    next(err);
  }
}
export async function updateCV(req, res, next) {
  try {
    const parsed = cvSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid CV fields", errors: parsed.error.flatten() });
    const cv = await CV.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).select("-__v");
    if (!cv) return res.status(404).json({ success: false, message: "CV not found" });
    res.json({ success: true, data: { cv } });
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ success: false, message: "CV not found" });
    next(err);
  }
}
export async function deleteCV(req, res, next) {
  try {
    const cv = await CV.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!cv) return res.status(404).json({ success: false, message: "CV not found" });
    res.json({ success: true, message: "CV deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ success: false, message: "CV not found" });
    next(err);
  }
}
export async function generateCV(req, res, next) {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: "Please provide valid CV information", errors: parsed.error.flatten() });
    const input = parsed.data;
    let generated;
    let usedExternalAI = false;

    // The project can run without an external AI key. If a key is configured,
    // use OpenAI; otherwise create a safe local draft from the user's own facts.
    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Do not send the photo (large) to the AI.
      const { photo, ...personalForAI } = input.personalInfo;
      const aiInput = {};
      for (const key of CONTENT_KEYS) aiInput[key] = key === "personalInfo" ? personalForAI : input[key];
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a careful professional CV writer for ANY profession (medical, nutrition, engineering, teaching, business, IT, etc.). Return only a JSON object with the same keys you receive: personalInfo, education, experience, skills, projects, certifications, languages, achievements, volunteerExperience, interests, customSections. Keep all supplied factual details truthful. Improve grammar, clarity and professional phrasing, write short action-style bullet lines (one per line, separated by \\n) inside description fields, and write a strong 3-5 sentence professional summary in personalInfo.summary if it is empty or weak. NEVER invent employers, degrees, dates, metrics, certifications, tools or achievements. If a detail is missing, leave it blank. Keep every array in the same length and the same object shape as the input (do not add, remove or reorder items). For customSections keep title, placement and kind unchanged and only improve the text in lines and entries. personalInfo must include fullName,email,phone,address,jobTitle,highlights,summary. Return valid JSON only.`
          },
          {
            role: "user",
            content: `Create polished CV content for target role "${input.personalInfo.jobTitle}". Improve the provided information without inventing facts. Preserve identity/contact details. Input JSON:\n${JSON.stringify(aiInput)}`
          }
        ]
      });
      try { generated = JSON.parse(completion.choices?.[0]?.message?.content || "{}"); }
      catch { return res.status(502).json({ success: false, message: "AI returned an unreadable response. Please try again." }); }
      usedExternalAI = true;
    } else {
      const current = input.personalInfo.summary.trim();
      const role = input.personalInfo.jobTitle.trim();
      const skills = input.skills.slice(0, 6);
      generated = {
        personalInfo: {
          ...input.personalInfo,
          summary: current || `${input.personalInfo.fullName} is pursuing opportunities as a ${role}. ${skills.length ? `Key skills include ${skills.join(", ")}.` : "Relevant education, experience and skills are listed in this CV."} This profile is based on the information provided by the candidate.`
        }
      };
    }

    // Accept each AI section only if it passes the same validation as user input;
    // otherwise keep what the user typed. This stops broken/unsafe AI output from being saved.
    const safe = {};
    for (const key of CONTENT_KEYS) {
      const candidate = generated?.[key];
      if (candidate === undefined || candidate === null) continue;
      if (key === "personalInfo" ? typeof candidate !== "object" || Array.isArray(candidate) : !Array.isArray(candidate)) continue;
      if (key !== "personalInfo" && candidate.length !== input[key].length) continue; // AI must not add/remove items
      const check = cvSchema.shape[key].safeParse(candidate);
      if (check.success) safe[key] = check.data;
    }
    safe.personalInfo = {
      ...input.personalInfo,
      ...(safe.personalInfo || {}),
      fullName: input.personalInfo.fullName,
      email: input.personalInfo.email,
      phone: input.personalInfo.phone,
      address: input.personalInfo.address,
      jobTitle: input.personalInfo.jobTitle,
      highlights: input.personalInfo.highlights,
      photo: input.personalInfo.photo
    };
    if (safe.customSections) {
      safe.customSections = safe.customSections.map((section, i) => ({
        ...section,
        title: input.customSections[i].title,
        placement: input.customSections[i].placement,
        kind: input.customSections[i].kind
      }));
    }

    const cv = await CV.create({
      ...input,
      ...safe,
      user: req.userId,
      generatedByAI: usedExternalAI
    });
    res.status(201).json({ success: true, data: { cv: plainCV(cv) } });
  } catch (err) {
    if (err.status === 429) return res.status(503).json({ success: false, message: "AI provider rate limit reached. Please try again later." });
    next(err);
  }
}
