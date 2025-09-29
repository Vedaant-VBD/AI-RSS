"use client";

import React, { useState, useEffect } from "react";
import ResumeViewer from "./ResumeViewer";
import ProfessionalLogin from "../components/ProfessionalLogin";
import ProfessionalHeader from "../components/ProfessionalHeader";
import JobManagement from "../components/JobManagement";
import CandidateMatches from "../components/CandidateMatches";
import "../styles/globals.css";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedResume, setParsedResume] = useState<any>(null);
  
  // Recruiter job upload state
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ [jobId: string]: any[] }>({});
  const [matchesLoading, setMatchesLoading] = useState<{ [jobId: string]: boolean }>({});
  const [matchesError, setMatchesError] = useState<{ [jobId: string]: string | null }>({});
  const [sortBy, setSortBy] = useState<string>('overall');

  useEffect(() => {
    // Check for token and role in localStorage on mount
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      const storedRole = localStorage.getItem("role");
      setRole(storedRole);
    }
  }, []);

  // Fetch jobs for recruiter
  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("token");
      if ((role === "job_poster" || role === "admin") && token) {
        setJobLoading(true);
        setJobError(null);
        try {
          const res = await fetch("http://localhost:4000/jobs", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch jobs");
          const data = await res.json();
          setJobs(data);
        } catch (err: any) {
          setJobError(err.message || "Error fetching jobs");
        } finally {
          setJobLoading(false);
        }
      }
    };
    fetchJobs();
  }, [role, isAuthenticated]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    setParsedResume(null);
    
    try {
      // Parse PDF on client-side to avoid server-side issues
      const { parseResumeFromPdf } = await import("./parse-resume-from-pdf");
      const fileUrl = URL.createObjectURL(file);
      const parsedResume = await parseResumeFromPdf(fileUrl);
      
      setMessage("✅ Resume parsed successfully!");
      setParsedResume(parsedResume);
      
      // Clean up the object URL
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setMessage("❌ Failed to parse resume - please check the PDF format");
      console.error("Parse error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setRole(null);
  };

  const handleShowMatches = async (jobId: string) => {
    setMatchesLoading(prev => ({ ...prev, [jobId]: true }));
    setMatchesError(prev => ({ ...prev, [jobId]: null }));
    try {
      const res = await fetch(`http://localhost:4000/jobs/${jobId}/match`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch matches');
      }
      const data = await res.json();
      console.log('Matches received:', data);
      setMatches(prev => ({ ...prev, [jobId]: data }));
    } catch (err: any) {
      console.error('Match error:', err);
      setMatchesError(prev => ({ ...prev, [jobId]: err.message || 'Error fetching matches' }));
    } finally {
      setMatchesLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <ProfessionalLogin onLogin={(roleFromLogin) => {
      setIsAuthenticated(true);
      setRole(roleFromLogin);
    }} />;
  }

  // Professional Recruiter Dashboard
  if (role === "job_poster" || role === "admin") {
    const handleJobUploadWrapper = async (title: string, description: string) => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      setJobLoading(true);
      setJobError(null);
      
      try {
        const res = await fetch("http://localhost:4000/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, description }),
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to upload job");
        }
        
        // Show success message
        setJobError("✅ Job uploaded and enhanced with AI successfully!");
        setTimeout(() => setJobError(null), 3000);
        
        // Refresh jobs list
        const jobsRes = await fetch("http://localhost:4000/jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      } catch (err: any) {
        setJobError(err.message || "Error uploading job");
      } finally {
        setJobLoading(false);
      }
    };

    return (
      <div style={{ minHeight: "100vh" }}>
        <ProfessionalHeader userRole={role} onLogout={handleLogout} />
        
        <div style={{ padding: "32px 0" }}>
          <JobManagement
            jobs={jobs}
            onJobUpload={handleJobUploadWrapper}
            onShowMatches={handleShowMatches}
            jobLoading={jobLoading}
            jobError={jobError}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
          />
          
          {/* Render matches for each job */}
          {Object.entries(matches).map(([jobId, jobMatches]) => {
            const job = jobs.find(j => j._id === jobId);
            if (!job || !jobMatches || jobMatches.length === 0) return null;
            
            return (
              <div key={jobId} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                <CandidateMatches
                  jobId={jobId}
                  jobTitle={job.title}
                  matches={jobMatches}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Professional Job Seeker Dashboard
  return (
    <div style={{ minHeight: "100vh" }}>
      <ProfessionalHeader userRole={role} onLogout={handleLogout} />
      
      <div style={{ 
        maxWidth: 800, 
        margin: "0 auto", 
        padding: "32px 20px",
        textAlign: "center" 
      }}>
        <div className="card">
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Upload Your Resume
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
              Upload your resume to get matched with relevant job opportunities
            </p>
          </div>

          <label htmlFor="file-upload" className="btn-primary" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 16,
            padding: "14px 28px"
          }}>
            {uploading && <div className="loading-spinner"></div>}
            {uploading ? "Processing..." : "📎 Choose PDF File"}
            <input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>

          {message && (
            <div className={`fade-in ${message.includes("✅") ? "status-success" : "status-error"}`}>
              {message}
            </div>
          )}

          {parsedResume && (
            <div className="fade-in" style={{ marginTop: 24 }}>
              <ResumeViewer resume={parsedResume} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}