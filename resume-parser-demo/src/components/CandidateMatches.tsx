import React, { useState, useEffect } from 'react';

interface Match {
  score: number;
  embeddingScore: number;
  contentScore: number;
  skillOverlap: number;
  matchingSkills: string[];
  resume: {
    parsedResume: {
      name: string;
      email?: string;
      skills: string | { featuredSkills?: any[]; descriptions?: any[] } | any;
      experience: string;
      education?: string;
      summary?: string;
    };
  };
  explanation: string[];
}

interface CandidateMatchesProps {
  jobId: string;
  jobTitle: string;
  matches: Match[];
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

// Helper functions for score colors
function getScoreColor(score: number | undefined): string {
  if (!score) return '#666';
  if (score >= 0.8) return '#4caf50'; // Green - Excellent
  if (score >= 0.6) return '#8bc34a'; // Light Green - Good
  if (score >= 0.4) return '#ffc107'; // Yellow - Moderate
  if (score >= 0.2) return '#ff9800'; // Orange - Poor
  return '#f44336'; // Red - Very Poor
}

function getSkillMatchColor(skillCount: number | undefined): string {
  if (!skillCount) return '#666';
  if (skillCount >= 3) return '#4caf50'; // Green - Many skills
  if (skillCount >= 2) return '#8bc34a'; // Light Green - Good skills
  if (skillCount >= 1) return '#ffc107'; // Yellow - Some skills
  return '#f44336'; // Red - No skills
}

function getScoreLabel(score: number): string {
  if (score >= 0.8) return 'Excellent Match';
  if (score >= 0.6) return 'Good Match';
  if (score >= 0.4) return 'Moderate Match';
  if (score >= 0.2) return 'Fair Match';
  return 'Poor Match';
}

export default function CandidateMatches({ 
  jobId, 
  jobTitle, 
  matches, 
  sortBy, 
  onSortChange 
}: CandidateMatchesProps) {
  const [expandedResumes, setExpandedResumes] = useState<{ [key: string]: boolean }>({});
  // Modal state for expanded resume
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Match | null>(null);
  // AI summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const toggleExpanded = (resumeKey: string) => {
    setExpandedResumes(prev => ({
      ...prev,
      [resumeKey]: !prev[resumeKey]
    }));
  };

  const openResumeModal = (candidate: Match) => {
    setSelectedCandidate(candidate);
    setModalOpen(true);
  };

  const closeResumeModal = () => {
    setModalOpen(false);
    setSelectedCandidate(null);
    setAiSummary(null);
    setSummaryError(null);
  };

  // Fetch AI summary when modal opens and candidate changes
  useEffect(() => {
    if (modalOpen && selectedCandidate) {
      setAiSummary(null);
      setSummaryError(null);
      setSummaryLoading(true);
      fetch('http://localhost:4000/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: selectedCandidate.resume?.parsedResume })
      })
        .then(res => res.json())
        .then(data => {
          if (data.summary) {
            setAiSummary(data.summary);
          } else {
            setSummaryError('No summary returned.');
          }
        })
        .catch(err => {
          setSummaryError('Failed to fetch summary.');
        })
        .finally(() => setSummaryLoading(false));
    }
  }, [modalOpen, selectedCandidate]);

  const sortedMatches = [...matches].sort((a, b) => {
    switch (sortBy) {
      case 'semantic':
        return (b.embeddingScore || 0) - (a.embeddingScore || 0);
      case 'skills':
        return (b.skillOverlap || 0) - (a.skillOverlap || 0);
      case 'content':
        return (b.contentScore || 0) - (a.contentScore || 0);
      case 'overall':
      default:
        return (b.score || 0) - (a.score || 0);
    }
  });

  if (matches.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40, marginTop: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h3 style={{ marginBottom: 8, color: 'rgba(255, 255, 255, 0.8)' }}>
          No matches found
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Try uploading more resumes or adjusting the job requirements
        </p>
      </div>
    );
  }

  return (
    <div className="slide-up" style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 4 }}>
            🎯 Top Candidates for "{jobTitle}"
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0, fontSize: 14 }}>
            Found {matches.length} matching candidates
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              color: '#fff',
              padding: '6px 12px',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <option value="overall">🎯 Best Overall Match</option>
            <option value="semantic">🧠 AI Job Fit</option>
            <option value="skills">⚡ Tech Skills Match</option>
            <option value="content">📋 Resume Quality</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sortedMatches.map((match, i) => {
          const resume = match.resume?.parsedResume || {};
          const isTop = i === 0;
          const resumeKey = `${jobId}-${i}`;
          const expanded = expandedResumes[resumeKey] || false;

          return (
            <div 
              key={i} 
              className="card fade-in"
              style={{
                border: isTop ? "2px solid #0070f3" : "1px solid rgba(255, 255, 255, 0.1)",
                background: isTop 
                  ? "linear-gradient(135deg, rgba(0, 112, 243, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                position: 'relative'
              }}
            >
              {/* Top Candidate Badge */}
              {isTop && (
                <div style={{
                  position: 'absolute',
                  top: -1,
                  right: 20,
                  background: 'linear-gradient(135deg, #0070f3 0%, #00d4ff 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '0 0 8px 8px',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  🏆 TOP MATCH
                </div>
              )}

              {/* Candidate Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 20
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    fontSize: 18, 
                    fontWeight: 700, 
                    margin: '0 0 4px 0',
                    color: '#fff'
                  }}>
                    {resume.name || 'Unnamed Candidate'}
                  </h4>
                  {resume.email && (
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.6)', 
                      margin: '0 0 8px 0',
                      fontSize: 14
                    }}>
                      📧 {resume.email}
                    </p>
                  )}
                  <div style={{ 
                    display: 'inline-block',
                    background: getScoreColor(match.score),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {getScoreLabel(match.score)} ({(match.score * 100).toFixed(1)}%)
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-secondary"
                    onClick={() => openResumeModal(match)}
                    style={{ fontSize: 14 }}
                  >
                    📄 Expand Resume
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => alert('Shortlist feature coming soon!')}
                    style={{ fontSize: 14 }}
                  >
                    ⭐ Shortlist
                  </button>
                </div>
              </div>

              {/* Score Grid */}
              <div className="score-grid">
                <div className="score-card">
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🎯</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(match.score) }}>
                    {(match.score * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                    Overall Match
                  </div>
                </div>

                <div className="score-card">
                  <div style={{ fontSize: 20, marginBottom: 4 }}>🧠</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(match.embeddingScore) }}>
                    {match.embeddingScore ? (match.embeddingScore * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                    AI Job Fit
                  </div>
                </div>

                <div className="score-card">
                  <div style={{ fontSize: 20, marginBottom: 4 }}>⚡</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getSkillMatchColor(match.skillOverlap) }}>
                    {match.skillOverlap || 0} skills
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                    Skills Match
                  </div>
                </div>

                <div className="score-card">
                  <div style={{ fontSize: 20, marginBottom: 4 }}>📋</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(match.contentScore) }}>
                    {match.contentScore ? (match.contentScore * 100).toFixed(0) + '%' : 'N/A'}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                    Resume Quality
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: 16,
                marginTop: 16
              }}>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Skills:</strong>{' '}
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {(() => {
                      if (!resume.skills) return 'Not specified';
                      
                      // Handle string skills
                      if (typeof resume.skills === 'string') {
                        return resume.skills;
                      }
                      
                      // Handle object skills with featuredSkills and descriptions
                      if (typeof resume.skills === 'object') {
                        const skillParts = [];
                        
                        if (resume.skills.featuredSkills && Array.isArray(resume.skills.featuredSkills)) {
                          const featuredSkills = resume.skills.featuredSkills
                            .map((skill: any) => typeof skill === 'string' ? skill : skill.skill || '')
                            .filter(Boolean)
                            .join(', ');
                          if (featuredSkills) skillParts.push(featuredSkills);
                        }
                        
                        if (resume.skills.descriptions && Array.isArray(resume.skills.descriptions)) {
                          const descriptions = resume.skills.descriptions
                            .filter((desc: any) => typeof desc === 'string' && desc.trim())
                            .join(', ');
                          if (descriptions) skillParts.push(descriptions);
                        }
                        
                        return skillParts.length > 0 ? skillParts.join(', ') : 'Skills listed';
                      }
                      
                      // Fallback for other types
                      return String(resume.skills);
                    })()}
                  </span>
                </div>
                
                {match.matchingSkills && match.matchingSkills.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Matching Skills:</strong>{' '}
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {match.matchingSkills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(76, 175, 80, 0.2)',
                            color: '#4caf50',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 500
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {match.matchingSkills.length > 5 && (
                        <span style={{ 
                          color: 'rgba(255, 255, 255, 0.5)', 
                          fontSize: 12 
                        }}>
                          +{match.matchingSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expanded && (
                <div className="fade-in" style={{ 
                  marginTop: 16,
                  padding: 16,
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h5 style={{ marginBottom: 16, color: '#fff' }}>📄 Full Resume Details</h5>
                  
                  {resume.summary && (
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Summary:</strong>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        margin: '4px 0 0 0',
                        lineHeight: 1.5
                      }}>
                        {resume.summary}
                      </p>
                    </div>
                  )}
                  
                  {resume.experience && (
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Experience:</strong>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        margin: '4px 0 0 0',
                        lineHeight: 1.5
                      }}>
                        {resume.experience}
                      </p>
                    </div>
                  )}
                  
                  {resume.education && (
                    <div>
                      <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Education:</strong>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        margin: '4px 0 0 0',
                        lineHeight: 1.5
                      }}>
                        {resume.education}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modalOpen && selectedCandidate && (
        <div className="resume-modal-overlay">
          <div className="resume-modal">
            <button className="close-btn" onClick={closeResumeModal}>&times;</button>
            {/* Two-pane layout will be implemented next */}
            <div style={{ display: 'flex', height: '80vh', width: '80vw' }}>
              <div style={{ flex: 1, overflowY: 'auto', background: '#222', color: '#fff', padding: 24 }}>
                <h3>Resume</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedCandidate.resume?.parsedResume, null, 2)}</pre>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', background: '#111', color: '#fff', padding: 24 }}>
                <h3>AI Summary</h3>
                {summaryLoading && <div>Loading summary...</div>}
                {summaryError && <div style={{ color: 'red' }}>{summaryError}</div>}
                {aiSummary && <div style={{ whiteSpace: 'pre-wrap' }}>{aiSummary}</div>}
              </div>
            </div>
          </div>
          <style jsx>{`
            .resume-modal-overlay {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(0,0,0,0.7);
              z-index: 1000;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .resume-modal {
              background: #181818;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              position: relative;
              min-width: 60vw;
              min-height: 60vh;
              max-width: 90vw;
              max-height: 90vh;
              overflow: hidden;
            }
            .close-btn {
              position: absolute;
              top: 12px;
              right: 20px;
              font-size: 2rem;
              background: none;
              border: none;
              color: #fff;
              cursor: pointer;
              z-index: 10;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}