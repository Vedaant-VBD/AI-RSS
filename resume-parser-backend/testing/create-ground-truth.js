    /**
 * Ground Truth Dataset Creator
 * Creates manually annotated resume-job pairs for accuracy testing
 */

const fs = require('fs');
const path = require('path');

class GroundTruthCreator {
  constructor() {
    this.groundTruthData = [];
    this.annotationSchema = {
      resumeId: String,
      jobId: String,
      humanScore: Number, // 1-5 scale
      relevanceLevel: String, // 'excellent', 'good', 'fair', 'poor', 'irrelevant'
      matchingSkills: Array,
      experienceMatch: String, // 'perfect', 'close', 'some', 'none'
      educationMatch: String,
      notes: String,
      annotatorId: String,
      timestamp: Date
    };
  }

  /**
   * Create annotation template for human reviewers
   */
  createAnnotationTemplate(resumeData, jobData) {
    return {
      resumeId: resumeData._id,
      jobId: jobData._id,
      resumeSummary: {
        name: resumeData.parsedResume?.name || 'N/A',
        skills: resumeData.parsedResume?.skills || 'N/A',
        experience: resumeData.parsedResume?.experience || 'N/A',
        education: resumeData.parsedResume?.education || 'N/A'
      },
      jobSummary: {
        title: jobData.title,
        description: jobData.description.substring(0, 200) + '...',
        keyRequirements: this.extractKeyRequirements(jobData.description)
      },
      annotationForm: {
        overallMatch: null, // 1-5 scale
        skillsMatch: null,  // 1-5 scale
        experienceMatch: null, // 1-5 scale
        educationMatch: null, // 1-5 scale
        relevanceLevel: null, // 'excellent', 'good', 'fair', 'poor', 'irrelevant'
        matchingSkills: [],
        notes: '',
        wouldInterview: null // true/false
      }
    };
  }

  extractKeyRequirements(jobDescription) {
    // Simple keyword extraction for key requirements
    const keywords = [
      'required', 'must have', 'essential', 'minimum', 'years experience',
      'degree', 'bachelor', 'master', 'certification'
    ];
    
    const sentences = jobDescription.split(/[.!?]+/);
    return sentences.filter(sentence => 
      keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    ).slice(0, 5);
  }

  /**
   * Generate annotation tasks for human reviewers
   */
  async generateAnnotationTasks(resumes, jobs, samplesPerJob = 20) {
    const tasks = [];
    
    for (const job of jobs) {
      // Get system's top matches for this job
      const systemMatches = await this.getSystemMatches(job._id);
      
      // Add top matches (likely good matches)
      const topMatches = systemMatches.slice(0, 10);
      
      // Add random samples (likely poor matches)
      const randomSamples = this.getRandomSamples(resumes, 10, 
        topMatches.map(m => m.resume._id));
      
      // Combine and create annotation tasks
      const allSamples = [...topMatches, ...randomSamples];
      
      for (const sample of allSamples) {
        const resumeData = sample.resume || sample;
        tasks.push(this.createAnnotationTemplate(resumeData, job));
      }
    }
    
    return tasks;
  }

  getRandomSamples(resumes, count, excludeIds = []) {
    const available = resumes.filter(r => !excludeIds.includes(r._id));
    const shuffled = available.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async getSystemMatches(jobId) {
    // This would call your existing matching endpoint
    const response = await fetch(`http://localhost:4000/jobs/${jobId}/match`);
    return await response.json();
  }

  /**
   * Save annotation tasks to file for human reviewers
   */
  saveAnnotationTasks(tasks, filename = 'annotation-tasks.json') {
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 2));
    console.log(`📝 Created ${tasks.length} annotation tasks in ${filename}`);
    return outputPath;
  }

  /**
   * Load completed annotations
   */
  loadAnnotations(filename = 'completed-annotations.json') {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  }
}

module.exports = GroundTruthCreator;