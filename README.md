# Resume Readiness Check 🚀

**Resume Readiness Check** is a modern full-stack web application that evaluates candidate resumes against configurable, role-specific technical skills rubrics. 

A candidate uploads their resume (PDF or DOCX), the server extracts and normalizes the text, compares it against the active skills rubric, computes a weighted score server-side, and delivers clear, constructive, actionable feedback.

---

## 🌟 Key Features

1. **Configurable Skills Rubric System**:
   - Roles and skills are configured entirely in JSON (`src/rubrics/web-development.json`, `src/rubrics/frontend-engineering.json`).
   - Add new engineering roles by simply adding a JSON file—no code alterations required.
   - Each skill defines weight percentages, synonyms, and targeted competencies.
2. **Robust File Extraction**:
   - Accepts `.pdf` (via `pdf-parse`) and `.docx` (via `mammoth`).
   - Strictly enforces a 5MB size limit and file type validation.
   - Cleans and strips redundant whitespace.
3. **AI Comparison & Built-in Engine**:
   - Support for **OpenAI** (`gpt-4o-mini`), **Anthropic Claude** (`claude-3-5-sonnet`), and **Google Gemini** (`gemini-2.0-flash`).
   - Zero-friction out-of-the-box mode: Built-in local rubric heuristic engine ensures the app works immediately even before entering an API key.
4. **Deterministic Server-Side Scoring**:
   - Sums the verified skill weights strictly server-side (never trusts model arithmetic).
   - Compares the total computed score against the role threshold (e.g. 70%).
5. **Constructive Candidate Experience**:
   - **Pass State (Score ≥ Threshold)**: Confirmation badge ("Threshold Cleared • Ready to Proceed"), forward CTA ("Proceed to Technical Round"), and evidence list citing specific snippets from the resume.
   - **Needs Work State (Score < Threshold)**: Constructive roadmap ("Path to Clearance", e.g., 30 points to target), matched skills list recognizing existing strengths, and a missing skills list with tailored, non-generic actionable tips for adding evidence.
   - Strictly constructive tone throughout ("here's what to add"), never punitive or rejecting.
6. **Privacy Guaranteed**:
   - Files are processed purely in ephemeral memory and discarded immediately upon response delivery.

---

## 🏗️ Project Architecture

```
resume-maker/
├── api/
│   ├── check.js              # Serverless function: multipart upload → extract → AI / engine → weighted score
│   └── rubrics.js            # API endpoint returning available role rubrics
├── src/
│   ├── components/
│   │   ├── UploadScreen.jsx  # Hero, role selector, dropzone, sample resume quick-test cards
│   │   ├── LoadingState.jsx  # Honest multi-step progress indicator
│   │   └── ResultScreen.jsx  # Circular score gauge, Pass/Needs Work banners, evidence & tips list
│   ├── data/
│   │   └── samples.js        # Built-in candidate test profiles (Pass & Needs Work)
│   ├── rubrics/
│   │   ├── index.js          # Rubric loader and helper utilities
│   │   ├── web-development.json      # Web Development benchmark (70% threshold)
│   │   └── frontend-engineering.json # Frontend Engineering benchmark (70% threshold)
│   ├── App.jsx               # Main application shell & state machine
│   ├── main.jsx              # React DOM mounting
│   ├── styles.css            # Rich modern design system & animations
│   └── index.css             # Root import
├── public/
│   └── sample-files/         # Downloadable sample test resumes (.pdf)
├── scripts/
│   └── generate-samples.js   # Script to generate sample PDF resumes
├── .env.example              # Environment variable template
├── .env                      # Local environment variables (git-ignored)
├── package.json              # Project dependencies & scripts
├── vite.config.js            # Vite config with integrated dev server API middleware
└── vercel.json               # Serverless deployment routing configuration
```

---

## 🛠️ Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`, you can add your preferred LLM key:
```env
# Optional: OpenAI, Anthropic Claude, or Google Gemini
LLM_API_KEY=sk-...
```
> **Note**: If left blank, the application will automatically run using the high-accuracy local rubric engine!

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. 
Vite serves both the React client and the backend serverless endpoints (`/api/check`, `/api/rubrics`) simultaneously on the same port!

---

## 🚀 Deployment (Vercel)

The app is built to deploy directly to Vercel with zero configuration:

1. Push your repository to GitHub / GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `LLM_API_KEY`: Your OpenAI, Anthropic, or Gemini API key.
4. Deploy! Vercel automatically deploys the Vite frontend and provisions `/api/check` and `/api/rubrics` as serverless functions.

---

## 📋 Adding New Role Rubrics

To create a new role rubric:
1. Create a JSON file in `src/rubrics/` (e.g., `src/rubrics/mobile-dev.json`):
```json
{
  "id": "mobile-development",
  "role": "Mobile Development",
  "threshold": 70,
  "description": "Evaluates competencies in native and cross-platform mobile app development.",
  "skills": [
    { "name": "React Native / Flutter", "weight": 25, "synonyms": ["React Native", "Flutter", "Dart"] },
    { "name": "Mobile State Management", "weight": 15, "synonyms": ["Redux", "MobX", "Bloc"] },
    { "name": "REST / GraphQL APIs", "weight": 15, "synonyms": ["Axios", "RESTful", "Apollo"] },
    { "name": "App Store Deployment", "weight": 15, "synonyms": ["TestFlight", "Google Play Console", "CI/CD"] },
    { "name": "Offline Storage", "weight": 15, "synonyms": ["SQLite", "Realm", "AsyncStorage"] },
    { "name": "Automated Testing", "weight": 15, "synonyms": ["Jest", "Detox", "Maestro"] }
  ]
}
```
2. Import and add it to `src/rubrics/index.js`.
The frontend and backend will immediately recognize the new role, compute weighted scores, and provide targeted feedback!
