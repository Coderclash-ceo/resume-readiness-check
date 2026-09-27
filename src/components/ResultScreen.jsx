import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Printer, 
  Lightbulb, 
  ArrowRight,
  Flame,
  Target,
  Layers,
  ChevronRight,
  Award,
  UserCheck,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultScreen({ result, onReset }) {
  // Support switching between evaluated roles right on the result screen
  const [activeRoleId, setActiveRoleId] = useState(result.roleId || 'web-development');
  const [activeFilter, setActiveFilter] = useState('all');

  const allEvals = result.allRoleEvaluations || {};
  const currentEval = allEvals[activeRoleId] || result;

  const { 
    role, 
    threshold, 
    score, 
    passed, 
    headline, 
    summary, 
    matched = [], 
    missing = [], 
    stats = {}, 
    provider,
    bestFit,
    roleSuitability = [],
    benchmarkInfo
  } = { ...result, ...currentEval };

  useEffect(() => {
    if (passed) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback if canvas-confetti is not loaded
      }
    }
  }, [passed, activeRoleId]);

  const totalSkills = matched.length + missing.length;

  const filteredSkills = () => {
    if (activeFilter === 'matched') {
      return matched.map(item => ({ ...item, isMatched: true }));
    }
    if (activeFilter === 'missing') {
      return missing.map(item => ({ ...item, isMatched: false }));
    }
    return [
      ...matched.map(item => ({ ...item, isMatched: true })),
      ...missing.map(item => ({ ...item, isMatched: false }))
    ];
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="result-screen">
      {/* Top Navigation Bar with Back Button */}
      <div className="result-nav-bar">
        <button 
          type="button" 
          className="btn-back-nav" 
          onClick={onReset}
          id="btn-back-to-upload"
        >
          <ArrowLeft size={16} />
          <span>← Back to Resume Upload / Select Another Profile</span>
        </button>

        <div className="benchmark-tag">
          <Target size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Active Rubric: <strong>{role}</strong> ({threshold}% Target)</span>
        </div>
      </div>

      {/* Evaluated Resume Profile & Benchmark Context */}
      <div className="candidate-context-card">
        <div className="candidate-context-info">
          <div className="candidate-avatar-icon">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="candidate-badge-tag">Evaluated Resume</div>
            <h2 className="candidate-display-title">
              {stats.fileName ? stats.fileName.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' ') : 'Candidate Profile'}
            </h2>
            <div className="candidate-sub-stats">
              <span>{stats.words || 0} words analyzed</span>
              <span>•</span>
              <span>{stats.characters || 0} characters</span>
              <span>•</span>
              <span>Evaluated by: {provider || 'Skills Engine'}</span>
            </div>
          </div>
        </div>

        <div className="benchmark-context-info">
          <div className="benchmark-sub-tag">Checking Against Industry Benchmark</div>
          <div className="benchmark-title-bold">
            <Target size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>{role} Competencies Checklist</span>
          </div>
          <p className="benchmark-desc-text">
            Comparing verified evidence against the <strong>{threshold}% readiness threshold</strong> across {totalSkills} required technical skills.
          </p>
        </div>
      </div>

      {/* Role Suitability & Best Match Matrix */}
      {roleSuitability.length > 0 && (
        <div className="role-fit-matrix-box">
          <div className="best-fit-banner">
            <div className="best-fit-icon">
              <Award size={26} />
            </div>
            <div className="best-fit-text">
              <div className="best-fit-label">
                <Sparkles size={14} />
                <span>Career Fit & Role Suitability Assessment</span>
              </div>
              <h3 className="best-fit-title">
                Best Fit: <span className="highlight-text">{bestFit?.role}</span> ({bestFit?.score}% Alignment)
              </h3>
              <p className="best-fit-desc">
                {bestFit?.recommendation || `Your resume demonstrates strongest alignment with ${bestFit?.role}.`}
              </p>
            </div>
          </div>

          <div className="matrix-instruction">
            <span>Role Qualification Breakdown (Click any role card below to inspect its detailed skills checklist):</span>
          </div>

          <div className="role-cards-grid">
            {roleSuitability.map(r => {
              const isSelected = activeRoleId === r.roleId;
              const isPassing = r.passed;

              return (
                <div 
                  key={r.roleId} 
                  className={`role-comparison-card ${isSelected ? 'selected' : ''} ${isPassing ? 'pass-card' : ''}`}
                  onClick={() => {
                    setActiveRoleId(r.roleId);
                    setActiveFilter('all');
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-header">
                    <span className="role-name-text">{r.role}</span>
                    <span className={`role-pill ${isPassing ? 'pass' : 'needswork'}`}>
                      {isPassing ? '✓ Highly Suitable' : 'Needs Work'}
                    </span>
                  </div>

                  <div className="role-score-display">
                    <span className="role-big-score">{r.score}%</span>
                    <span className="role-threshold-sub">/ {r.threshold}% target</span>
                  </div>

                  <div className="role-card-footer">
                    <span className="role-active-indicator">
                      {isSelected ? '● Currently Inspecting' : 'Click to inspect checklist →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Role Result Header Card */}
      <div className={`result-header-card ${passed ? 'pass' : 'needswork'}`}>
        <div className="result-top-grid">
          {/* Circular Score Gauge */}
          <div className="score-gauge-box">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`circle ${passed ? 'pass' : 'needswork'}`}
                strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="19" className="gauge-percentage">{score}%</text>
              <text x="18" y="25" className="gauge-label">READINESS</text>
            </svg>
            <span className="gauge-threshold-caption">Threshold: {threshold}%</span>
          </div>

          {/* Result Copy */}
          <div>
            <div className={`result-status-badge ${passed ? 'pass' : 'needswork'}`}>
              {passed ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>{role} Standard Cleared • Ready to Apply</span>
                </>
              ) : (
                <>
                  <Flame size={16} />
                  <span>{role} Roadmap • {threshold - score} pts to clearance</span>
                </>
              )}
            </div>

            <h1 className="result-headline">{headline}</h1>
            <p className="result-summary-text">{summary}</p>

            <div className="result-cta-bar">
              {passed ? (
                <>
                  <button 
                    type="button" 
                    className="btn-cta-pass"
                    onClick={() => alert(`Proceeding with application for ${role}!`)}
                  >
                    <span>Proceed to Technical Round</span>
                    <ArrowRight size={17} />
                  </button>
                  <button type="button" className="btn-action-outline" onClick={handlePrint}>
                    <Printer size={16} />
                    <span>Print Readiness Summary</span>
                  </button>
                  <button type="button" className="btn-action-outline" onClick={onReset}>
                    <ArrowLeft size={16} />
                    <span>Evaluate Another Resume</span>
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-action-outline" onClick={handlePrint}>
                    <Printer size={16} />
                    <span>Print Actionable Checklist</span>
                  </button>
                  <button type="button" className="btn-action-outline" onClick={onReset}>
                    <ArrowLeft size={16} />
                    <span>Upload Another Resume</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills Breakdown Header & Filter Tabs */}
      <div className="skills-section-header">
        <div>
          <h3>{role} Competencies Checklist</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Comparing verified resume evidence against {role} requirements.
          </p>
        </div>

        <div className="filter-pills" role="tablist">
          <button
            type="button"
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Skills ({totalSkills})
          </button>
          <button
            type="button"
            className={`filter-btn ${activeFilter === 'matched' ? 'active' : ''}`}
            onClick={() => setActiveFilter('matched')}
          >
            Matched ({matched.length})
          </button>
          {!passed && (
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'missing' ? 'active' : ''}`}
              onClick={() => setActiveFilter('missing')}
            >
              Missing Areas ({missing.length})
            </button>
          )}
        </div>
      </div>

      {/* Evaluated Skills List */}
      <div className="skills-list-container">
        {filteredSkills().map(item => {
          const isMatched = item.isMatched;

          return (
            <div 
              key={item.skill} 
              className={`skill-evaluation-card ${isMatched ? 'matched' : 'missing'}`}
            >
              <div className="skill-card-top">
                <div className="skill-title-group">
                  <div className="skill-status-icon">
                    {isMatched ? <CheckCircle2 size={16} /> : <Lightbulb size={16} />}
                  </div>
                  <div>
                    <span className="skill-name">{item.skill}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="skill-weight-badge">{item.weight}% weight</span>
                  <span 
                    className={`sample-status-pill ${isMatched ? 'pass' : 'needswork'}`}
                    style={{ fontSize: '0.72rem' }}
                  >
                    {isMatched ? 'Verified' : 'Needs Evidence'}
                  </span>
                </div>
              </div>

              {/* Card Detail / Quote or Actionable Tip */}
              <div className="card-content-box">
                {isMatched ? (
                  <div className="evidence-quote-box">
                    <strong>Resume Evidence:</strong>
                    <span>"{item.evidence}"</span>
                  </div>
                ) : (
                  <div className="tip-actionable-box">
                    <Lightbulb size={18} className="tip-icon" />
                    <div className="tip-text">
                      <strong>Actionable Tip (How to add evidence):</strong>
                      <span>{item.tip}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metadata & Audit Bar */}
      <div className="audit-footer-bar">
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span><strong>File:</strong> {stats.fileName || 'Document'}</span>
          <span><strong>Length:</strong> {stats.characters || 0} characters</span>
          <span><strong>Words:</strong> {stats.words || 0} words</span>
          <span><strong>Evaluator:</strong> {provider || 'Rubric Matcher'}</span>
        </div>
        <div>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={onReset}
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
}
