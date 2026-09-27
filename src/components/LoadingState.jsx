import React, { useState, useEffect } from 'react';
import { Search, FileSearch, CheckCircle2, Cpu } from 'lucide-react';

export default function LoadingState({ roleName, fileName }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { label: 'Reading and parsing resume document...', detail: fileName || 'Uploaded document' },
    { label: `Comparing evidence against the ${roleName} rubric...`, detail: 'Checking required skills and synonyms' },
    { label: 'Computing weighted scores and tailoring actionable tips...', detail: 'Synthesizing evaluation results' }
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepIndex(1), 1200);
    const timer2 = setTimeout(() => setStepIndex(2), 2600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="loading-wrapper glass-card">
      {/* Radar Pulse Effect */}
      <div className="loading-radar-ring">
        <div className="radar-circle"></div>
        <div className="radar-circle"></div>
        <div className="radar-circle"></div>
        <div className="radar-center-icon">
          <FileSearch size={26} />
        </div>
      </div>

      <h2 className="loading-title">Evaluating Your Resume</h2>
      <p className="loading-subtitle">
        Reading your resume, comparing against the <strong>{roleName}</strong> checklist.
      </p>

      {/* Progress Steps */}
      <div className="loading-steps-box">
        {steps.map((step, idx) => {
          const isDone = idx < stepIndex;
          const isActive = idx === stepIndex;

          return (
            <div 
              key={step.label} 
              className={`loading-step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="step-bullet">
                {isDone ? <CheckCircle2 size={14} /> : <span>{idx + 1}</span>}
              </div>
              <div>
                <div>{step.label}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{step.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
