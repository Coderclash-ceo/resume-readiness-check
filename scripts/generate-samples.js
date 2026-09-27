import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/sample-files');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function createStandardPdf(lines) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([600, 850]);
  let y = 800;

  for (const line of lines) {
    if (y < 50) break;
    const isHeading = line.startsWith('ALEX') || line.startsWith('JORDAN') || 
                      line === 'SUMMARY' || line === 'TECHNICAL SKILLS' || 
                      line === 'EXPERIENCE' || line === 'PROJECTS' || line === 'SKILLS';

    if (line.trim()) {
      page.drawText(line, {
        x: 40,
        y: y,
        size: isHeading ? 11 : 9.5,
        font: isHeading ? boldFont : font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
    y -= isHeading ? 18 : 14;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
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

async function generate() {
  const alexPdf = await createStandardPdf(alexLines);
  const jordanPdf = await createStandardPdf(jordanLines);

  fs.writeFileSync(path.join(outDir, 'alex-morgan-senior-fullstack.pdf'), alexPdf);
  fs.writeFileSync(path.join(outDir, 'jordan-lee-junior-frontend.pdf'), jordanPdf);

  console.log('Generated spec-compliant PDFs with pdf-lib successfully!');
}

generate().catch(console.error);
