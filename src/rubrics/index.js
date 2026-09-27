import webDev from './web-development.json' with { type: 'json' };
import frontendEng from './frontend-engineering.json' with { type: 'json' };

export const rubrics = [
  webDev,
  frontendEng
];

export function getRubricById(id) {
  return rubrics.find(r => r.id === id) || rubrics[0];
}

export default rubrics;
