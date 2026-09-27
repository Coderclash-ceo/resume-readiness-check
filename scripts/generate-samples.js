import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/sample-files');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createTextPdf(lines) {
  // Simple valid PDF-1.4 text generator
  const content = 'BT /F1 11 Tf 40 750 Td 14 TL ' + lines.map(l => {
    const escaped = l.replace(/[()\\\\]/g, ' ');
    return `(${escaped}) '`;
  }).join(' ') + ' ET';

  const streamLen = content.length;
  let pdf = '%PDF-1.4\n';
  const offsets = [];

  function addObj(str) {
    offsets.push(pdf.length);
    pdf += str + '\n';
  }

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  addObj('4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + content + '\nendstream\nendobj');
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startXref = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (const o of offsets) {
    pdf += String(o).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF\n';
  return Buffer.from(pdf);
}

// 1. Alex Morgan (Pass)
const alexLines = [
  'ALEX MORGAN - SENIOR FULL-STACK DEVELOPER',
  'San Francisco, CA | alex.morgan.dev@email.com',
  '',
  'SUMMARY',
  'Experienced Full-Stack Engineer with 5 years in modern web development.',
  'Proficient in JavaScript, React, Node.js, databases, and CI/CD pipelines.',
  '',
  'TECHNICAL SKILLS',
  '- Languages: JavaScript ES6+, TypeScript, Java, SQL',
  '- Frontend: React, Redux, HTML5, CSS3, Tailwind',
  '- Backend: Node.js, Express, REST APIs, GraphQL',
  '- Databases: PostgreSQL, MySQL, MongoDB',
  '- DevOps: Git, GitHub, Docker, AWS, Vercel hosting, CI/CD',
  '- Testing: Jest, React Testing Library, unit tests, Cypress QA',
  '',
  'EXPERIENCE',
  'Senior Software Engineer at CloudScale Solutions (2022 - Present)',
  '- Architected customer web portal using React and TypeScript.',
  '- Developed high-throughput Node.js microservices with REST APIs.',
  '- Managed relational schemas and queries in PostgreSQL and MySQL.',
  '- Deployed microservices to Vercel and AWS with automated pipelines.',
  '- Authored comprehensive unit tests and integration tests with Jest.',
  '- Coordinated team workflows using Git pull requests on GitHub.',
  '',
  'Software Engineer at Apex Labs (2020 - 2022)',
  '- Built responsive web apps using React and JavaScript.',
  '- Maintained backend services using Java and Spring Boot.',
  '- Designed REST APIs and integrated database models.'
];

// 2. Jordan Lee (Needs Work)
const jordanLines = [
  'JORDAN LEE - JUNIOR FRONTEND DEVELOPER',
  'Austin, TX | jordan.lee@email.com',
  '',
  'SUMMARY',
  'Junior frontend developer passionate about responsive design and UI.',
  'Looking to expand into full-stack engineering roles.',
  '',
  'SKILLS',
  '- JavaScript (ES6), HTML5, CSS3, React',
  '- Git, GitHub, VS Code, Figma',
  '- Responsive web design and UI components',
  '',
  'PROJECTS',
  'Recipe Finder App (2024)',
  '- Built an interactive single-page recipe finder using React.',
  '- Styled responsive layouts with CSS grid and flexbox.',
  '- Tracked commits and branches using Git on GitHub.',
  '',
  'Personal Portfolio (2023)',
  '- Created personal developer portfolio with semantic HTML and CSS.',
  '- Implemented interactive UI components with plain JavaScript.'
];

fs.writeFileSync(path.join(outDir, 'alex-morgan-senior-fullstack.pdf'), createTextPdf(alexLines));
fs.writeFileSync(path.join(outDir, 'jordan-lee-junior-frontend.pdf'), createTextPdf(jordanLines));

console.log('Sample PDF resumes generated successfully in public/sample-files/');
