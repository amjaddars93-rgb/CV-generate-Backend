import { z } from "zod";

const short = z.string().trim().max(200).optional().default("");
const item = z.object({
  qualification: short, institution: short, year: short, description: z.string().trim().max(3000).optional().default(""),
  role: short, company: short, duration: short, name: short, technologies: short, url: z.string().trim().max(500).optional().default(""),
  issuer: short, proficiency: short, organization: short
}).passthrough();

const entry = z.object({
  heading: short, subheading: short, date: short,
  description: z.string().trim().max(3000).optional().default("")
});
const customSection = z.object({
  title: z.string().trim().max(60).optional().default(""),
  placement: z.enum(["sidebar", "main"]).optional().default("main"),
  kind: z.enum(["bullets", "entries", "text"]).optional().default("bullets"),
  lines: z.string().trim().max(4000).optional().default(""),
  entries: z.array(entry).max(20).optional().default([])
});

const sectionTitle = z.string().trim().max(60).optional();
const sectionTitles = z.object({
  summary: sectionTitle, education: sectionTitle, experience: sectionTitle, skills: sectionTitle,
  projects: sectionTitle, certifications: sectionTitle, languages: sectionTitle,
  achievements: sectionTitle, volunteerExperience: sectionTitle, interests: sectionTitle
});

const skill = z.string().trim().min(1).max(150);
const templates = z.enum(["sidebar", "modern", "classic", "minimal"]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// Photos are resized in the browser to a small JPEG/PNG data URL.
const photo = z.string().max(300000).refine((v) => v === "" || v.startsWith("data:image/"), "Photo must be an image").optional();

export const cvSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  template: templates.optional(),
  accentColor: color.optional(),
  personalInfo: z.object({
    fullName: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(160).or(z.literal("")).optional(),
    phone: z.string().trim().max(50).optional(),
    address: z.string().trim().max(200).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    highlights: z.string().trim().max(300).optional(),
    summary: z.string().trim().max(3000).optional(),
    photo
  }).optional(),
  sectionTitles: sectionTitles.optional(),
  education: z.array(item).max(20).optional(),
  experience: z.array(item).max(30).optional(),
  skills: z.array(skill).max(80).optional(),
  projects: z.array(item).max(30).optional(),
  certifications: z.array(item).max(30).optional(),
  languages: z.array(item).max(30).optional(),
  achievements: z.array(z.string().trim().max(500)).max(50).optional(),
  volunteerExperience: z.array(item).max(30).optional(),
  interests: z.array(z.string().trim().max(80)).max(50).optional(),
  customSections: z.array(customSection).max(10).optional()
}).strict();

export const generateSchema = z.object({
  title: z.string().trim().min(1).max(120).default("My Professional CV"),
  template: templates.default("sidebar"),
  accentColor: color.optional().default("#0b3b9a"),
  personalInfo: z.object({
    fullName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(160).or(z.literal("")).optional().default(""),
    phone: z.string().trim().max(50).optional().default(""),
    address: z.string().trim().max(200).optional().default(""),
    jobTitle: z.string().trim().min(1).max(120),
    highlights: z.string().trim().max(300).optional().default(""),
    summary: z.string().trim().max(3000).optional().default(""),
    photo: photo.default("")
  }),
  sectionTitles: sectionTitles.optional().default({}),
  education: z.array(item).max(20).optional().default([]),
  experience: z.array(item).max(30).optional().default([]),
  skills: z.array(skill).max(80).optional().default([]),
  projects: z.array(item).max(30).optional().default([]),
  certifications: z.array(item).max(30).optional().default([]),
  languages: z.array(item).max(30).optional().default([]),
  achievements: z.array(z.string().trim().max(500)).max(50).optional().default([]),
  volunteerExperience: z.array(item).max(30).optional().default([]),
  interests: z.array(z.string().trim().max(80)).max(50).optional().default([]),
  customSections: z.array(customSection).max(10).optional().default([])
});
