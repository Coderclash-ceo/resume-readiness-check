import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft, 
  Sparkles, 
  Share2, 
  Printer, 
  Lightbulb, 
  ArrowRight,
  ShieldAlert,
  Flame,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultScreen({ result, onReset }) {
  const [activeFilter, setActiveFilter] = useState(result.passed ? 'matched' : 'all');

  useEffect(() => {
    if (result.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback if canvas-confetti is not loaded
      }
    }
  }, [result.passed]);

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
    provider 
  } = result;

  const totalSkills = matched.length + missing.length;
  const strokeDashoffset = 100 - score;

  const filteredSkills = () => {
    if (activeFilter === 'matched') {
      return matched.map(item => ({ ...item, isMatched: true }));
    }
    if (activeFilter === 'missing') {
      return missing.map(item => ({ ...item, isMatched: false }));
    }
    // 'all'
    const combined = [
      ...matched.map(item => ({ ...item, isMatched: true })),
      ...missing.map(item => ({ ...item, isMatched: false }))
    ];
    return combined;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="result-screen">
      {/* Top Result Banner */}
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
                  <span>Threshold Cleared • Ready to Proceed</span>
                </>
              ) : (
                <>
                  <Flame size={16} />
                  <span>Actionable Roadmap • Needs Work ({threshold - score} pts to target)</span>
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
                    onClick={() => alert('Proceeding to technical interview scheduler / application submission!')}
                  >
                    <span>Proceed to Technical Stage</span>
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
                    <span>Test Another Resume</span>
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
          <h3>Skills & Evidence Breakdown</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Comparing resume evidence against the <strong>{role}</strong> competency standard.
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
      <div 
        style={{ 
          marginTop: '2.5rem', 
          padding: '1.25rem', 
          background: 'rgba(15, 23, 42, 0.45)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.82rem',
          color: 'var(--text-dim)'
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span><strong>File:</strong> {stats.fileName || 'Document'}</span>
          <span><strong>Characters:</strong> {stats.characters || 0}</span>
          <span><strong>Words:</strong> {stats.words || 0}</span>
          <span><strong>Engine:</strong> {provider || 'Rubric Matcher'}</span>
        </div>
        <div>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            onClick={onReset}
          >
            Check Another File
          </button>
        </div>
      </div>
    </div>
  );
}
