import Busboy from 'busboy';
import mammoth from 'mammoth';
import 'dotenv/config';
import { getRubricById } from '../src/rubrics/index.js';

// Vercel serverless configuration: disable automatic body parsing so Busboy streams multipart data
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Extracts raw text from PDF buffer using pdf-parse
 */
async function extractTextFromPdf(buffer) {
  // Primary extractor: pdf2json (robust, modern, zero-DOM dependencies for serverless)
  try {
    const PDFParser = (await import('pdf2json')).default;
    const text = await new Promise((resolve, reject) => {
      const parser = new PDFParser(null, 1);
      parser.on('pdfParser_dataReady', () => {
        const raw = parser.getRawTextContent() || '';
        resolve(raw);
      });
      parser.on('pdfParser_dataError', errData => {
        reject(new Error(errData?.parserError || 'PDF parsing failed'));
      });
      parser.parseBuffer(buffer);
    });

    if (text && text.trim().length > 20) {
      return text;
    }
  } catch (err) {
    console.warn('pdf2json attempt warning:', err.message);
  }

  // Fallback extractor: pdf-parse
  try {
    let pdfFn;
    try {
      const mod = await import('pdf-parse/lib/pdf-parse.js');
      pdfFn = mod.default || mod;
    } catch {
      const mod = await import('pdf-parse');
      pdfFn = mod.default || mod;
    }

    if (typeof pdfFn === 'function') {
      const data = await pdfFn(buffer);
      if (data.text) return data.text;
    }
    if (pdfFn && pdfFn.PDFParse) {
      const parser = new pdfFn.PDFParse({ data: buffer });
      const res = await parser.getText();
      await parser.destroy?.();
      return typeof res === 'string' ? res : (res?.text || '');
    }
  } catch (err2) {
    console.warn('pdf-parse fallback warning:', err2.message);
  }

  throw new Error('Could not extract readable text from this PDF file.');
}

/**
 * Extracts raw text from DOCX buffer using mammoth
 */
async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('DOCX extraction error:', err);
    throw new Error(`Failed to extract text from DOCX: ${err.message}`);
  }
}

/**
 * Strips excess whitespace and normalizes text
 */
function cleanWhitespace(text) {
  if (!text) return '';
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses multipart form data with 5MB limit
 */
function parseMultipartRequest(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error('Content-Type must be multipart/form-data'));
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1,
      },
    });

    const fields = {};
    let fileBuffer = null;
    let fileInfo = null;
    let fileLimitHit = false;

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, info) => {
      const { filename, mimeType } = info;
      fileInfo = { filename, mimeType };
      const chunks = [];

      fileStream.on('data', chunk => {
        chunks.push(chunk);
      });

      fileStream.on('limit', () => {
        fileLimitHit = true;
      });

      fileStream.on('end', () => {
        if (!fileLimitHit) {
          fileBuffer = Buffer.concat(chunks);
        }
      });
    });

    busboy.on('finish', () => {
      if (fileLimitHit) {
        return reject(new Error('File exceeds the 5MB size limit. Please upload a smaller resume.'));
      }
      resolve({ fields, fileBuffer, fileInfo });
    });

    busboy.on('error', err => reject(err));

    // Handle stream piping in Node or pre-buffered body
    if (req.body && Buffer.isBuffer(req.body)) {
      busboy.end(req.body);
    } else if (req.body && typeof req.body === 'string') {
      busboy.end(Buffer.from(req.body));
    } else if (typeof req.pipe === 'function') {
      req.pipe(busboy);
    } else {
      reject(new Error('Malformed request stream'));
    }
  });
}

/**
 * Reads JSON payload for sample resume testing or direct text input
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return resolve(req.body);
    }
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', err => reject(err));
  });
}

/**
 * Intelligent local rubric heuristic engine
 * Used when no LLM API key is configured or as fallback/offline mode
 */
function evaluateWithLocalEngine(resumeText, rubric) {
  const lowerText = resumeText.toLowerCase();
  const matched = [];
  const missing = [];

  for (const skill of rubric.skills) {
    const searchTerms = [skill.name, ...(skill.synonyms || [])];
    let foundMatch = null;
    let matchEvidence = '';

    for (const term of searchTerms) {
      // Look for term boundary
      const cleanTerm = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${cleanTerm}\\b`, 'i');
      const matchIndex = lowerText.search(regex);

      if (matchIndex !== -1) {
        foundMatch = term;
        // Extract surrounding context snippet (approx 120 chars)
        const start = Math.max(0, matchIndex - 30);
        const end = Math.min(resumeText.length, matchIndex + term.length + 80);
        let snippet = resumeText.slice(start, end).replace(/\s+/g, ' ').trim();
        if (start > 0) snippet = '...' + snippet;
        if (end < resumeText.length) snippet = snippet + '...';
        matchEvidence = snippet;
        break;
      }
    }

    if (foundMatch) {
      matched.push({
        skill: skill.name,
        evidence: matchEvidence || `Demonstrated knowledge or project application of ${foundMatch}.`
      });
    } else {
      missing.push({
        skill: skill.name,
        tip: generateConstructiveTip(skill.name, rubric.role)
      });
    }
  }

  return { matched, missing };
}

/**
 * Generates tailored, constructive, actionable tips for missing skills
 */
function generateConstructiveTip(skillName, role) {
  const tipsMap = {
    'JavaScript': 'Add a bullet point highlighting modern JavaScript (ES6+, async/await, DOM or event loops) in a recent web project.',
    'Node.js': 'Describe a backend service or script you built with Node.js, highlighting frameworks like Express, routing, or middleware.',
    'Java': 'Detail any object-oriented software or backend service developed with Java or Spring Boot, including data handling.',
    'React': 'Showcase a component-driven UI or interactive dashboard you built using React (state hooks, props, lifecycle/effects).',
    'SQL / Databases': 'Include an example of database schema design, queries, or ORM usage (e.g. PostgreSQL, MySQL, or MongoDB).',
    'Git / Version Control': 'Mention collaborating via GitHub/GitLab, pull requests, branch management, or version-controlled repositories.',
    'REST APIs': 'Specify endpoints you designed, integrated, or consumed (e.g. JSON REST APIs, third-party authentication or data feeds).',
    'Deployment': 'Note where your apps are hosted (e.g., deployed live on Vercel, Netlify, or AWS with CI/CD pipelines).',
    'Testing': 'Highlight unit or integration testing experience with frameworks like Jest, React Testing Library, Cypress, or Vitest.',
    'HTML & Modern CSS': 'Describe your responsive design work, CSS architecture (e.g. Tailwind, Flexbox, Grid), and cross-device testing.',
    'State Management': 'Mention how you manage complex application state across components (e.g. Redux Toolkit, Zustand, or React Context).',
    'Web Performance & SEO': 'Add quantifiable evidence of optimizing Core Web Vitals, Lighthouse scores, lazy loading, or search visibility.'
  };

  return tipsMap[skillName] || `Provide a concrete bullet point detailing how you applied ${skillName} in a project, coursework, or open-source contribution.`;
}

/**
 * Builds the LLM prompt matching the specified rubric template
 */
function buildRubricPrompt(rubric, resumeText) {
  const skillsList = rubric.skills
    .map(s => `- ${s.name} (${s.weight}% weight)${s.synonyms && s.synonyms.length > 0 ? ` [Synonyms: ${s.synonyms.join(', ')}]` : ''}`)
    .join('\n');

  return `You are a precise technical resume reviewer. Compare the RESUME text against the REQUIRED SKILLS list below. For each required skill, decide if it is explicitly evidenced in the resume (literal mention, listed synonym, or a clearly described project using it) — do not give credit for vague or implied claims.

REQUIRED SKILLS (with weights):
${skillsList}

RESUME TEXT:
"""${resumeText}"""

Return ONLY valid JSON:
{
  "matched": [{"skill": string, "evidence": string}],
  "missing": [{"skill": string, "tip": string}],
  "score": number
}`;
}

/**
 * Calls the configured LLM API (OpenAI, Anthropic, or Gemini)
 */
async function callLlmEvaluator(prompt, rubric) {
  const rawKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey) {
    return null; // Will trigger local heuristic evaluation
  }

  // 1. Anthropic Claude (if key starts with sk-ant or ANTHROPIC_API_KEY is present)
  if (apiKey.startsWith('sk-ant') || process.env.ANTHROPIC_API_KEY) {
    const antKey = (process.env.ANTHROPIC_API_KEY || apiKey).trim();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': antKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.1,
        system: 'You are an expert technical resume evaluator. Return strictly valid JSON containing matched and missing skill objects.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return { ...JSON.parse(cleanJson), provider: 'Anthropic Claude' };
  }

  // 2. Google Gemini (if key starts with AIza or AQ or GEMINI_API_KEY is present)
  if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ') || process.env.GEMINI_API_KEY) {
    const geminiKey = (process.env.GEMINI_API_KEY || apiKey).trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return { ...JSON.parse(rawText), provider: 'Google Gemini' };
  }

  // 3. OpenAI (if key starts with sk- or OPENAI_API_KEY is present)
  if (apiKey.startsWith('sk-') || process.env.OPENAI_API_KEY) {
    const openAiKey = (process.env.OPENAI_API_KEY || apiKey).trim();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical resume reviewer. Return strictly valid JSON containing matched and missing skill lists.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '{}';
    return { ...JSON.parse(rawText), provider: 'OpenAI GPT-4o' };
  }

  // Unrecognized key format -> return null to gracefully use local heuristic engine
  console.warn('[ResumeCheck] Unrecognized API key format, falling back to local heuristic engine.');
  return null;
}

/**
 * Main request handler for /api/check
 */
export default async function handler(req, res) {
  // Polyfill helper methods for raw Node http.ServerResponse (e.g. Vite dev middleware)
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    };
  }

  // CORS and method handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }


  try {
    let resumeText = '';
    let roleId = 'web-development';
    let fileName = 'resume';

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const { fields, fileBuffer, fileInfo } = await parseMultipartRequest(req);
      roleId = fields.role || 'web-development';

      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ error: 'No resume file uploaded. Please select a .pdf or .docx file.' });
      }

      fileName = fileInfo?.filename || 'Uploaded Resume';
      const lowerFilename = fileName.toLowerCase();

      // Validate file extension
      if (lowerFilename.endsWith('.pdf')) {
        resumeText = await extractTextFromPdf(fileBuffer);
      } else if (lowerFilename.endsWith('.docx')) {
        resumeText = await extractTextFromDocx(fileBuffer);
      } else {
        return res.status(400).json({
          error: 'Unsupported file type. Only .pdf and .docx files are accepted.'
        });
      }
    } else if (contentType.includes('application/json')) {
      // Support direct text or sample resume testing
      const body = await readJsonBody(req);
      roleId = body.role || 'web-development';
      fileName = body.fileName || 'Sample Resume';
      resumeText = body.text || '';

      if (!resumeText.trim()) {
        return res.status(400).json({ error: 'Resume text is required.' });
      }
    } else {
      return res.status(400).json({
        error: 'Invalid request format. Send multipart/form-data or application/json.'
      });
    }

    // Strip excess whitespace
    const cleanedText = cleanWhitespace(resumeText);
    console.log(`[ResumeCheck] Extracted ${cleanedText.length} characters from ${fileName}`);

    if (cleanedText.length < 40) {
      return res.status(422).json({
        error: 'Could not extract sufficient text from the resume. If this is an image-only or scanned PDF, please provide a text-based document.'
      });
    }

    // Load rubric
    const rubric = getRubricById(roleId);
    if (!rubric) {
      return res.status(404).json({ error: `Rubric not found for role '${roleId}'` });
    }

    // AI comparison or Heuristic Engine
    const prompt = buildRubricPrompt(rubric, cleanedText);
    let evaluationResult = null;
    let providerName = 'Local Rubric Engine';

    try {
      const llmOutput = await callLlmEvaluator(prompt, rubric);
      if (llmOutput && Array.isArray(llmOutput.matched)) {
        evaluationResult = llmOutput;
        providerName = llmOutput.provider || 'AI Model';
      }
    } catch (llmError) {
      console.warn('[ResumeCheck] LLM evaluation failed or timed out, falling back to local heuristic engine:', llmError.message);
      // Graceful fallback to heuristic evaluation
      evaluationResult = null;
    }

    if (!evaluationResult) {
      evaluationResult = evaluateWithLocalEngine(cleanedText, rubric);
      providerName = 'Local Rubric Engine';
    }

    // Normalize matched skill names
    const matchedSkillsMap = new Map();
    (evaluationResult.matched || []).forEach(m => {
      if (m && m.skill) {
        matchedSkillsMap.set(m.skill.toLowerCase().trim(), m.evidence || '');
      }
    });

    const missingSkillsMap = new Map();
    (evaluationResult.missing || []).forEach(m => {
      if (m && m.skill) {
        missingSkillsMap.set(m.skill.toLowerCase().trim(), m.tip || '');
      }
    });

    // Server-side weighted scoring: sum weights of verified matched skills
    let computedScore = 0;
    const finalMatched = [];
    const finalMissing = [];

    rubric.skills.forEach(skill => {
      const skillNameLower = skill.name.toLowerCase().trim();
      let isMatched = false;
      let evidence = '';

      // Check direct match or synonym match from model output
      if (matchedSkillsMap.has(skillNameLower)) {
        isMatched = true;
        evidence = matchedSkillsMap.get(skillNameLower);
      } else {
        // Also check if any synonym was matched
        for (const [key, ev] of matchedSkillsMap.entries()) {
          if (skill.synonyms && skill.synonyms.some(s => s.toLowerCase() === key)) {
            isMatched = true;
            evidence = ev;
            break;
          }
        }
      }

      if (isMatched) {
        computedScore += skill.weight;
        finalMatched.push({
          skill: skill.name,
          weight: skill.weight,
          evidence: evidence || `Clear evidence of ${skill.name} found in resume projects or experience.`
        });
      } else {
        let tip = missingSkillsMap.get(skillNameLower) || '';
        if (!tip) {
          tip = generateConstructiveTip(skill.name, rubric.role);
        }
        finalMissing.push({
          skill: skill.name,
          weight: skill.weight,
          tip
        });
      }
    });

    // Ensure score does not exceed 100
    computedScore = Math.min(100, Math.round(computedScore));
    const passed = computedScore >= rubric.threshold;

    const constructiveHeadline = passed
      ? `Great work! Your resume clears the ${rubric.role} readiness standard.`
      : `You are on the right track! Here is your clear roadmap to clear the ${rubric.role} threshold.`;

    const summaryMessage = passed
      ? `Your profile demonstrated verified experience in ${finalMatched.length} of ${rubric.skills.length} core competencies (${computedScore}% score vs ${rubric.threshold}% target). You are ready to proceed!`
      : `Your profile currently scores ${computedScore}% against the ${rubric.threshold}% benchmark. Adding specific project evidence for ${finalMissing.length} missing skill${finalMissing.length > 1 ? 's' : ''} will elevate your candidacy.`;

    return res.status(200).json({
      role: rubric.role,
      roleId: rubric.id,
      threshold: rubric.threshold,
      score: computedScore,
      passed,
      headline: constructiveHeadline,
      summary: summaryMessage,
      matched: finalMatched,
      missing: finalMissing,
      stats: {
        fileName,
        characters: cleanedText.length,
        words: cleanedText.split(/\s+/).filter(Boolean).length,
        evaluatedSkills: rubric.skills.length,
        matchedCount: finalMatched.length,
        missingCount: finalMissing.length
      },
      provider: providerName,
      hasApiKey: Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)
    });
  } catch (error) {
    console.error('[ResumeCheck] Handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error processing resume.'
    });
  }
}
