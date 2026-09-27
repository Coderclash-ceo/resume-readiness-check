import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Download,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SAMPLE_RESUMES } from '../data/samples.js';

export default function UploadScreen({ 
  rubrics, 
  selectedRole, 
  onSelectRole, 
  onSubmitFile, 
  onSubmitSample, 
  errorMessage 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const activeRubric = rubrics.find(r => r.id === selectedRole) || rubrics[0];

  const validateAndSetFile = (file) => {
    setLocalError('');
    if (!file) return;

    const allowedExtensions = ['.pdf', '.docx'];
    const fileNameLower = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isAllowed) {
      setLocalError('Invalid file type. Only .pdf and .docx resume files are supported.');
      setSelectedFile(null);
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      setLocalError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB limit. Please upload a smaller file.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setLocalError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setLocalError('Please select a PDF or DOCX resume to check.');
      return;
    }
    onSubmitFile(selectedFile, selectedRole);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="upload-screen">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-pill">
          <Sparkles size={15} />
          <span>Configurable AI Skills Rubric Evaluator</span>
        </div>
        <h1 className="hero-title">
          Are You Ready For Your <span className="text-gradient">Next Technical Role?</span>
        </h1>
        <p className="hero-subtitle">
          Upload your resume to compare verified evidence against industry standard skills rubrics. 
          Get instant, constructive insights, weighted readiness scoring, and clear tips on what to highlight.
        </p>
      </section>

      {/* Main Glass Card */}
      <div className="glass-card">
        {/* Error Banners */}
        {(errorMessage || localError) && (
          <div className="error-banner" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={20} />
              <p>{errorMessage || localError}</p>
            </div>
            <button 
              onClick={() => setLocalError('')} 
              className="btn-remove-file"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Step 1: Target Role Selector */}
        <div className="role-bar">
          <span className="role-bar-label">
            <Layers size={14} /> 1. Select Target Role Rubric:
          </span>
          <div className="role-selector" role="tablist">
            {rubrics.map(rubric => {
              const isActive = rubric.id === selectedRole;
              return (
                <button
                  key={rubric.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`role-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectRole(rubric.id)}
                >
                  <span>{rubric.role}</span>
                  <span className="role-badge">{rubric.threshold}% Target</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Rubric Skills Preview */}
        <div className="rubric-preview-box">
          <div className="rubric-header">
            <h4>
              <span>Checking against {activeRubric.role} Skills Checklist</span>
            </h4>
            <span className="threshold-tag">Pass Threshold: {activeRubric.threshold}%</span>
          </div>
          <div className="skills-pill-cloud">
            {activeRubric.skills.map(skill => (
              <div key={skill.name} className="skill-pill-item">
                <span>{skill.name}</span>
                <span className="skill-pill-weight">{skill.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Upload Dropzone */}
        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            id="resume-file-input"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <div
              className={`dropzone-container ${dragActive ? 'is-dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="dropzone-icon-wrap">
                <UploadCloud size={34} />
              </div>
              <h3 className="dropzone-title">Upload your resume to check readiness</h3>
              <p className="dropzone-subtitle">
                Drag and drop your file here, or <strong style={{ color: 'var(--accent-cyan)' }}>browse local files</strong>
              </p>
              <div className="dropzone-badges">
                <span className="file-type-badge">PDF (.pdf)</span>
                <span className="file-type-badge">Word (.docx)</span>
                <span className="file-type-badge">Max 5MB</span>
              </div>
            </div>
          ) : (
            <div className="selected-file-card">
              <div className="file-meta-group">
                <div className="file-icon">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatFileSize(selectedFile.size)} • Ready for evaluation</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-remove-file"
                onClick={handleRemoveFile}
                title="Remove file"
                aria-label="Remove selected file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="btn-primary"
            disabled={!selectedFile}
            id="btn-check-resume"
          >
            <span>Analyze Resume Readiness</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Privacy Note */}
        <div className="privacy-reassurance">
          <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Privacy Guaranteed: Your resume is processed strictly in-memory and is never persisted on disk or database.</span>
        </div>

        {/* Sample Resumes Section */}
        <div className="samples-section">
          <div className="samples-header">
            <h3>
              <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>Or test instantly with pre-built candidate samples:</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              1-click evaluation
            </span>
          </div>

          <div className="samples-grid">
            {SAMPLE_RESUMES.map(sample => {
              const isPass = sample.expectedStatus.toLowerCase().includes('pass');
              return (
                <div key={sample.id} className="sample-card">
                  <div>
                    <div className="sample-top">
                      <div className="sample-title">{sample.title}</div>
                      <span className={`sample-status-pill ${isPass ? 'pass' : 'needswork'}`}>
                        {sample.expectedStatus}
                      </span>
                    </div>
                    <p className="sample-desc">{sample.summary}</p>
                  </div>

                  <div className="sample-actions">
                    <button
                      type="button"
                      className="btn-sample-run"
                      onClick={() => onSubmitSample(sample, selectedRole)}
                    >
                      <span>Run Evaluation</span>
                      <ChevronRight size={15} />
                    </button>
                    <a
                      href={`/sample-files/${sample.fileName}`}
                      download
                      className="btn-sample-download"
                      title={`Download ${sample.fileName}`}
                      aria-label={`Download ${sample.fileName}`}
                      onClick={(e) => {
                        // Check if file exists, else prevent error
                      }}
                    >
                      <Download size={15} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
