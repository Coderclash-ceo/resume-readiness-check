import React, { useState } from 'react';
import { rubrics } from './rubrics/index.js';
import UploadScreen from './components/UploadScreen.jsx';
import LoadingState from './components/LoadingState.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import { FileCheck, Sparkles, Shield, Cpu, RefreshCw, ArrowLeft } from 'lucide-react';

import './styles.css';

export default function App() {
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload' | 'loading' | 'result'
  const [selectedRole, setSelectedRole] = useState('web-development');
  const [activeFileName, setActiveFileName] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const activeRubric = rubrics.find(r => r.id === selectedRole) || rubrics[0];

  // Upload file handler
  const handleUploadFile = async (file, roleId) => {
    setCurrentStep('loading');
    setActiveFileName(file.name);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', roleId);

      const response = await fetch('/api/check', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process resume.');
      }

      setEvaluationResult(data);
      setCurrentStep('result');
    } catch (err) {
      console.error('File evaluation failed:', err);
      setErrorMessage(err.message || 'An error occurred while evaluating the resume.');
      setCurrentStep('upload');
    }
  };

  const handleReset = () => {
    setEvaluationResult(null);
    setErrorMessage('');
    setCurrentStep('upload');
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="nav-wrapper">
          <div className="brand" onClick={handleReset} role="button" tabIndex={0}>
            <div className="brand-icon">
              <FileCheck size={22} />
            </div>
            <div>
              <span className="brand-title">Resume Readiness Check</span>
              <span className="brand-badge">v1.0</span>
            </div>
          </div>

          <div className="nav-meta">
            {currentStep !== 'upload' && (
              <button
                type="button"
                className="nav-back-button"
                onClick={handleReset}
                id="btn-nav-back"
              >
                <ArrowLeft size={15} />
                <span>Back to Upload</span>
              </button>
            )}
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>{activeRubric.role} Checklist</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {currentStep === 'upload' && (
          <UploadScreen
            rubrics={rubrics}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onSubmitFile={handleUploadFile}
            errorMessage={errorMessage}
          />
        )}

        {currentStep === 'loading' && (
          <LoadingState
            roleName={activeRubric.role}
            fileName={activeFileName}
            onCancel={handleReset}
          />
        )}

        {currentStep === 'result' && evaluationResult && (
          <ResultScreen
            result={evaluationResult}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          <strong>Resume Readiness Check</strong> • In-memory evaluation against configurable skills rubrics.
          <br />
          Files are processed in memory and never stored on disk or persistent databases.
        </p>
      </footer>
    </div>
  );
}
