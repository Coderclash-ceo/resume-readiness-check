import rubrics from '../src/rubrics/index.js';

export default async function handler(req, res) {
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

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    rubrics: rubrics.map(r => ({
      id: r.id,
      role: r.role,
      threshold: r.threshold,
      description: r.description,
      skillsCount: r.skills.length,
      skills: r.skills
    }))
  });
}
