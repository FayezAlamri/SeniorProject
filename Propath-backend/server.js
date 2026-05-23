const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const Anthropic = require("@anthropic-ai/sdk");
const PDFParser = require("pdf2json");
require("dotenv").config();
 
const app = express();
const upload = multer({ dest: "uploads/", limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 
function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataReady", () => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });
    pdfParser.on("pdfParser_dataError", (err) => {
      reject(err.parserError || err);
    });
    pdfParser.loadPDF(filePath);
  });
}
 
app.use(cors());
app.use(express.json());
 
app.post("/analyze", upload.single("cv"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
 
  const cleanup = () => {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  };
 
  try {
    const cvText = await extractTextFromPDF(req.file.path);
    cleanup();
 
    if (!cvText || cvText.trim().length < 50) {
      return res.status(400).json({
        error: "Could not extract text from PDF. Make sure it's not a scanned image.",
      });
    }
 
    // ─── PRE-CHECK: Deterministic regex CV validation (no AI — cannot be fooled) ──
    // LAYER 1: Hard-reject known non-CV document types
    const hardRejectRules = [
      { pattern: /\b(transaction receipt|remittance|amount paid|reference no|sender name|receiver name|iban|swift code|bank transfer|wire transfer)\b/i, type: "Bank / Transfer Receipt" },
      { pattern: /\b(abstract\s*[\r\n]|literature review|doi\s*:|journal of|proceedings of|et al\.|keywords\s*:)\b/i, type: "Research Paper" },
      { pattern: /\b(invoice|bill to|subtotal|tax amount|total due|unit price|purchase order)\b/i, type: "Invoice / Receipt" },
      { pattern: /\b(this agreement|whereas|hereinafter|party of the first|governing law|indemnification)\b/i, type: "Legal Contract" },
      { pattern: /\b(patient name|diagnosis|prescription|dosage mg|physician|medical record no)\b/i, type: "Medical Document" },
      { pattern: /\b(table of contents|chapter \d+\s*[\r\n]|acknowledgements\s*[\r\n])\b/i, type: "Academic Report / Thesis" },
    ];

    for (const { pattern, type } of hardRejectRules) {
      if (pattern.test(cvText)) {
        return res.status(400).json({
          error: "Invalid document",
          details: `This file looks like a "${type}", not a CV or resume. Please upload your personal CV/resume as a PDF.`,
        });
      }
    }

    // LAYER 2: Positive CV signal scoring — must match at least 3 of 5
    const cvSignals = [
      { name: "work/technical experience section", pattern: /\b(work experience|professional experience|employment history|technical experience|career history|internship)\b/i },
      { name: "education section",                 pattern: /\b(education|bachelor|master'?s?|phd|ph\.d|diploma|degree|university|college)\b/i },
      { name: "skills section",                    pattern: /\b(skills|technical skills|core competencies|key skills|competencies|proficiencies)\b/i },
      { name: "personal contact info",             pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?\d[\d\s\-().]{6,}\d/ },
      { name: "cv keywords",                       pattern: /\b(profile|summary|objective|certifications?|achievements?|languages?|references?|volunteer|projects?)\b/i },
    ];

    const matchedSignals = cvSignals.filter(s => s.pattern.test(cvText));

    if (matchedSignals.length < 3) {
      return res.status(400).json({
        error: "Invalid document",
        details: `This file does not appear to be a CV or resume — only ${matchedSignals.length}/5 CV indicators found (${matchedSignals.map(s => s.name).join(", ") || "none"}). A valid CV should include sections like Experience, Education, Skills, and contact information.`,
      });
    }

    // ─── PASS 1: Deep reasoning — extract structured facts from the CV ───────
    // This "thinking pass" prevents the model from hallucinating skills or
    // fabricating experience. We ground the JSON generation in explicit facts.
    const reasoningResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514", // Sonnet = far better reasoning than Haiku
      max_tokens: 1500,
      system: `You are a professional CV analyst covering ALL industries — healthcare, technology, finance, education, law, and more.
Your job is to carefully read a CV and extract ONLY what is explicitly stated.
CRITICAL: Do NOT apply a technology or programming lens to non-tech candidates.
A doctor, nurse, or healthcare worker must be evaluated purely as a healthcare professional.
If something is not written in the CV, it does not exist.`,
      messages: [
        {
          role: "user",
          content: `Read this CV carefully and extract the following as a JSON object:
{
  "name": "candidate name if present, else 'Candidate'",
  "currentLevel": "Entry / Junior / Mid / Senior — based on years of experience and role titles",
  "yearsExperience": "number or 'student/fresh graduate'",
  "explicitSkills": ["every technical skill, tool, language, or framework explicitly mentioned"],
  "educationLevel": "highest degree mentioned",
  "targetDomain": "the most likely job domain — examples: 'Clinical Nursing', 'Healthcare Administration', 'Pharmacy', 'Physical Therapy', 'Medical Laboratory', 'Public Health', 'Frontend Development', 'Data Science', 'DevOps', 'Marketing', 'Finance', 'Education', etc. Match the ACTUAL field of the candidate, never assume tech.",
  "domainCategory": "one of: Healthcare / Technology / Finance / Education / Engineering / Legal / Creative / Business / Other",
  "notableStrengths": ["2-3 genuine standout points relevant to their actual field"],
  "clearWeaknesses": ["2-3 honest gaps visible in the CV — gaps must be within their own field, NOT missing skills from unrelated fields. E.g. for a doctor: 'no research publications listed', 'missing subspecialty certifications'. NEVER say 'no programming skills' for a non-tech candidate."]
}
 
Return ONLY the JSON. No markdown. No explanation.
 
CV:
${cvText}`,
        },
      ],
    });
 
    let cvProfile;
    try {
      const raw = reasoningResponse.content[0].text.replace(/```json|```/g, "").trim();
      cvProfile = JSON.parse(raw);
    } catch {
      throw new Error("Failed to parse CV profile from first pass.");
    }
 
    // ─── PASS 2: Generate final analysis grounded in Pass 1 facts ────────────
    const analysisResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: `You are a senior career advisor with 15+ years of experience across ALL industries — healthcare, technology, finance, law, education, and more.
You have already analyzed the candidate's CV and extracted the following verified profile:
${JSON.stringify(cvProfile, null, 2)}
 
STRICT RULES:
1. "summary" — 3 sentences about their standing WITHIN ${cvProfile.domainCategory}. 
   - NEVER mention lack of programming, coding, or tech skills unless domainCategory is Technology.
   - NEVER suggest the CV is misaligned with tech unless they explicitly listed tech roles as a goal.
   - Focus only on gaps within ${cvProfile.targetDomain}.
2. "missingSkills" — Skills must be 100% relevant to ${cvProfile.targetDomain} in ${cvProfile.domainCategory}.
   - Healthcare examples: "Advanced Cardiac Life Support (ACLS)", "EMR/EHR documentation", "clinical audit skills", "research publication experience", "subspecialty board certification"
   - Technology examples: frameworks, languages, cloud tools, etc.
   - NEVER suggest Python, SQL, programming, or data analysis for a Healthcare/non-Tech candidate.
   - MUST NOT include any skill already in explicitSkills.
3. "courses" — Output ONLY the course title, platform, and skill. Do NOT include url or price — those are added separately.
4. "jobs" — Jobs must be in ${cvProfile.domainCategory}, matching ${cvProfile.currentLevel}. Be honest about hiring chances.
5. "score" — CV strength for ${cvProfile.targetDomain} roles only. Be calibrated.`,
 
      messages: [
        {
          role: "user",
          content: `Based on the verified CV profile above, generate a career analysis JSON.
Return ONLY a raw JSON object — no markdown, no code blocks, no explanation.
 
{
  "name": "${cvProfile.name}",
  "targetDomain": "${cvProfile.targetDomain}",
  "currentLevel": "${cvProfile.currentLevel}",
  "score": <integer 0-100>,
  "scoreLabel": "<one of: Needs Work / Developing / Competitive / Strong / Exceptional>",
  "summary": "<3-sentence honest critical assessment>",
  "strengths": ["${cvProfile.notableStrengths.join('", "')}"],
  "missingSkills": [
    "<skill ABSENT from CV and relevant to ${cvProfile.targetDomain} in ${cvProfile.domainCategory} — NOT from another field>",
    "<skill ABSENT from CV and relevant to ${cvProfile.targetDomain} in ${cvProfile.domainCategory}>",
    "<skill ABSENT from CV and relevant to ${cvProfile.targetDomain} in ${cvProfile.domainCategory}>",
    "<skill ABSENT from CV and relevant to ${cvProfile.targetDomain} in ${cvProfile.domainCategory}>",
    "<skill ABSENT from CV and relevant to ${cvProfile.targetDomain} in ${cvProfile.domainCategory}>"
  ],
  "courses": [
    { "title": "<real course title on Coursera>",         "platform": "Coursera",          "skill": "<missing skill it addresses>" },
    { "title": "<real course title on Udemy>",            "platform": "Udemy",             "skill": "<missing skill it addresses>" },
    { "title": "<real course title on LinkedIn Learning>","platform": "LinkedIn Learning", "skill": "<missing skill it addresses>" },
    { "title": "<real course title on edX>",              "platform": "edX",               "skill": "<missing skill it addresses>" },
    { "title": "<real course title on Coursera or edX>",  "platform": "Coursera",          "skill": "<missing skill it addresses>" }
  ],
  "jobs": [
    { "title": "<realistic job title>", "match": "<why they qualify + what gap to close>", "level": "${cvProfile.currentLevel}", "demandTrend": "High / Medium / Low" },
    { "title": "<realistic job title>", "match": "<why they qualify + what gap to close>", "level": "${cvProfile.currentLevel}", "demandTrend": "High / Medium / Low" },
    { "title": "<realistic job title>", "match": "<why they qualify + what gap to close>", "level": "${cvProfile.currentLevel}", "demandTrend": "High / Medium / Low" }
  ],
  "nextSteps": [
    "<the single most impactful action they should take in the next 30 days>",
    "<second priority action>",
    "<third priority action>"
  ]
}`,
        },
      ],
    });
 
    const text = analysisResponse.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);

    // ─── PASS 3: Build course links instantly — no fetching, no AI ──────────
    // Platforms block server-side fetches and AI hallucinates URLs.
    // The only 100% reliable approach: use each platform's official search URL.
    // These links always work and land the user directly on relevant results.

    const buildCourseUrl = (platform, title) => {
      const q = encodeURIComponent(title);
      switch (platform) {
        case "Coursera":          return `https://www.coursera.org/search?query=${q}&productDifficultyLevel=Beginner&productDifficultyLevel=Intermediate`;
        case "Udemy":             return `https://www.udemy.com/courses/search/?q=${q}&sort=relevance&lang=en`;
        case "LinkedIn Learning": return `https://www.linkedin.com/learning/search?keywords=${q}&upsellOrderOrigin=default_guest_learning`;
        case "edX":               return `https://www.edx.org/search?q=${q}&tab=course`;
        default:                  return `https://www.google.com/search?q=${encodeURIComponent(platform + " " + title + " course")}`;
      }
    };

    const platformPricing = {
      "Coursera":          "Free to audit / ~$49–$79 for certificate",
      "Udemy":             "~$15–$20 (frequent sales)",
      "LinkedIn Learning": "Free with LinkedIn Premium / ~$39.99/mo",
      "edX":               "Free to audit / ~$50–$300 for certificate",
    };

    data.courses = data.courses.map((course) => ({
      ...course,
      url:   buildCourseUrl(course.platform, course.title),
      price: platformPricing[course.platform] || "See site for price",
    }));
 
    // Attach the verified profile so the frontend can use it
    data._profile = cvProfile;
 
    res.json(data);
  } catch (err) {
    cleanup();
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});
 
app.listen(3001, () => console.log("✅ Backend running on http://localhost:3001"));