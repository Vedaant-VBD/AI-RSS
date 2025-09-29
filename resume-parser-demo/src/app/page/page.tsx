"use client";
import { useState } from "react";

// Resume profile section
type ResumeProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  url: string;
  summary: string;
};

type ResumeEducation = {
  school: string;
  degree: string;
  gpa: string;
  date: string;
  descriptions: string[];
};

type ResumeWorkExperience = {
  company: string;
  jobTitle: string;
  date: string;
  descriptions: string[];
};

type ResumeProject = {
  project: string;
  date: string;
  descriptions: string[];
};

type ResumeSkillItem = {
  skill: string;
};

type ResumeSkills = {
  featuredSkills: ResumeSkillItem[];
  descriptions: string[];
};

type Resume = {
  profile: ResumeProfile;
  educations: ResumeEducation[];
  workExperiences: ResumeWorkExperience[];
  projects: ResumeProject[];
  skills: ResumeSkills;
  custom: {
    descriptions: string[];
  };
};

export default function Home() {
  const [resume, setResume] = useState<Resume | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    
    // Dynamic import to avoid server-side rendering issues
    const { parseResumeFromPdf } = await import("../parse-resume-from-pdf");
    const parsed = await parseResumeFromPdf(fileUrl);
    setResume(parsed);
    // You can now use `parsed` for further function calls
  };

  return (
    <main>
      <h1>Resume Parser Demo</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {resume && (
        <pre>{JSON.stringify(resume, null, 2)}</pre>
      )}
    </main>
  );
}