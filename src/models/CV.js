import mongoose from "mongoose";

const titleField = { type: String, default: "", maxlength: 60 };

const cvSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  template: { type: String, enum: ["sidebar", "modern", "classic", "minimal"], default: "sidebar" },
  accentColor: { type: String, default: "#0b3b9a", maxlength: 7 },
  personalInfo: {
    fullName: { type: String, default: "", maxlength: 120 },
    email: { type: String, default: "", maxlength: 160 },
    phone: { type: String, default: "", maxlength: 50 },
    address: { type: String, default: "", maxlength: 200 },
    jobTitle: { type: String, default: "", maxlength: 120 },
    highlights: { type: String, default: "", maxlength: 300 },
    summary: { type: String, default: "", maxlength: 3000 },
    photo: { type: String, default: "", maxlength: 300000 }
  },
  // Optional custom names for the standard sections, e.g. experience -> "Internship Experience"
  sectionTitles: {
    summary: titleField, education: titleField, experience: titleField, skills: titleField,
    projects: titleField, certifications: titleField, languages: titleField,
    achievements: titleField, volunteerExperience: titleField, interests: titleField
  },
  education: [{ qualification: String, institution: String, year: String, description: String }],
  experience: [{ role: String, company: String, duration: String, description: String }],
  skills: [{ type: String, trim: true, maxlength: 150 }],
  projects: [{ name: String, technologies: String, description: String, url: String }],
  certifications: [{ name: String, issuer: String, year: String }],
  languages: [{ name: String, proficiency: String }],
  achievements: [{ type: String, maxlength: 500 }],
  volunteerExperience: [{ role: String, organization: String, description: String }],
  interests: [{ type: String, maxlength: 80 }],
  // Any extra section the user wants (Thesis, Tools & Software, Publications, ...)
  // NOTE: the field is called "kind" (not "type") because "type" is reserved in Mongoose schemas.
  customSections: [{
    title: { type: String, default: "", maxlength: 60 },
    placement: { type: String, enum: ["sidebar", "main"], default: "main" },
    kind: { type: String, enum: ["bullets", "entries", "text"], default: "bullets" },
    lines: { type: String, default: "", maxlength: 4000 },
    entries: [{ heading: String, subheading: String, date: String, description: String }]
  }],
  generatedByAI: { type: Boolean, default: false }
}, { timestamps: true, minimize: false });

export default mongoose.model("CV", cvSchema);
