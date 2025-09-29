/**
 * Automated Accuracy Testing Suite
 * Runs comprehensive accuracy tests on the resume matching system
 */

// Import models only if they exist
let Job, User, mongoose;
try {
  mongoose = require('mongoose');
  Job = require('../job.model');
  User = require('../user.model');
} catch (error) {
  console.warn('⚠️ Some dependencies not found. Running in limited mode.');
}
const AccuracyMetrics = require('./accuracy-metrics');
const GroundTruthCreator = require('./create-ground-truth');
const fs = require('fs');
const path = require('path');

class AccuracyTestSuite {
  constructor() {
    this.metrics = new AccuracyMetrics();
    this.groundTruthCreator = new GroundTruthCreator();
    this.testResults = [];
  }

  /**
   * Run complete accuracy test suite
   */
  async runFullAccuracyTest() {
    console.log('🧪 Starting Accuracy Test Suite...\n');
    
    try {
      // 1. Load test data
      const testData = await this.loadTestData();
      console.log(`📊 Loaded ${testData.jobs.length} jobs and ${testData.resumes.length} resumes`);
      
      // 2. Load ground truth annotations
      const annotations = this.loadGroundTruthAnnotations();
      console.log(`📝 Loaded ${annotations.length} ground truth annotations`);
      
      // 3. Generate system predictions
      const systemResults = await this.generateSystemPredictions(testData.jobs);
      console.log(`🤖 Generated system predictions for ${systemResults.length} jobs`);
      
      // 4. Calculate accuracy metrics
      const accuracyReport = this.metrics.generateAccuracyReport(systemResults, annotations);
      console.log('📈 Calculated accuracy metrics');
      
      // 5. Run component-specific tests
      const componentTests = await this.runComponentTests(testData);
      console.log('🔧 Completed component-specific tests');
      
      // 6. Generate comprehensive report
      const finalReport = this.generateFinalReport(accuracyReport, componentTests);
      
      // 7. Save results
      this.saveTestResults(finalReport);
      
      console.log('\n✅ Accuracy Test Suite Completed!');
      this.printSummary(finalReport);
      
      return finalReport;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Load test data from database
   */
  async loadTestData() {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser');
    }

    const jobs = await Job.find().limit(50); // Limit for testing
    
    // Load resumes from MongoDB collection
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('resumeParserDB');
    const resumes = await db.collection('resumes').find().limit(200).toArray();
    await client.close();

    return { jobs, resumes };
  }

  /**
   * Load ground truth annotations
   */
  loadGroundTruthAnnotations() {
    const annotationPath = path.join(__dirname, 'ground-truth-annotations.json');
    
    if (!fs.existsSync(annotationPath)) {
      console.warn('⚠️ No ground truth annotations found. Creating sample data...');
      return this.createSampleAnnotations();
    }
    
    return JSON.parse(fs.readFileSync(annotationPath, 'utf8'));
  }

  /**
   * Create sample annotations for testing (when real annotations aren't available)
   */
  createSampleAnnotations() {
    // This creates synthetic annotations for testing purposes
    // In production, you'd use real human annotations
    return [
      {
        resumeId: 'sample1',
        jobId: 'job1',
        overallMatch: 4,
        relevanceLevel: 'excellent',
        skillsMatch: 5,
        experienceMatch: 4,
        educationMatch: 3
      },
      {
        resumeId: 'sample2',
        jobId: 'job1',
        overallMatch: 2,
        relevanceLevel: 'fair',
        skillsMatch: 2,
        experienceMatch: 3,
        educationMatch: 2
      }
      // Add more sample annotations...
    ];
  }

  /**
   * Generate system predictions for all jobs
   */
  async generateSystemPredictions(jobs) {
    const systemResults = [];
    
    for (const job of jobs) {
      try {
        const response = await fetch(`http://localhost:4000/jobs/${job._id}/match`);
        if (response.ok) {
          const matches = await response.json();
          systemResults.push({
            jobId: job._id.toString(),
            jobTitle: job.title,
            matches: matches
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get matches for job ${job._id}:`, error.message);
      }
    }
    
    return systemResults;
  }

  /**
   * Run component-specific accuracy tests
   */
  async runComponentTests(testData) {
    const componentResults = {};
    
    // Test resume parsing accuracy
    componentResults.resumeParsing = await this.testResumeParsingAccuracy();
    
    // Test embedding quality
    componentResults.embeddings = await this.testEmbeddingQuality(testData);
    
    // Test skill extraction
    componentResults.skillExtraction = await this.testSkillExtractionAccuracy();
    
    // Test scoring algorithm
    componentResults.scoring = await this.testScoringAlgorithm(testData);
    
    return componentResults;
  }

  /**
   * Test resume parsing accuracy
   */
  async testResumeParsingAccuracy() {
    console.log('🔍 Testing resume parsing accuracy...');
    
    // Load test resumes with known correct data
    const testCases = this.loadResumeParsingTestCases();
    let correctExtractions = 0;
    let totalFields = 0;
    
    for (const testCase of testCases) {
      const { parseResumeFromPdf } = require('../parser');
      const parsed = await parseResumeFromPdf(testCase.pdfBuffer);
      
      // Compare extracted fields with expected values
      const fieldAccuracy = this.compareExtractedFields(parsed, testCase.expected);
      correctExtractions += fieldAccuracy.correct;
      totalFields += fieldAccuracy.total;
    }
    
    return {
      accuracy: totalFields > 0 ? correctExtractions / totalFields : 0,
      totalFields,
      correctExtractions,
      testCases: testCases.length
    };
  }

  /**
   * Test embedding quality
   */
  async testEmbeddingQuality(testData) {
    console.log('🔍 Testing embedding quality...');
    
    // Test semantic similarity between similar documents
    const embeddingService = require('../embedding-service');
    
    const similarityTests = [
      {
        text1: "Software Engineer with JavaScript and React experience",
        text2: "Frontend Developer skilled in JS and React",
        expectedSimilarity: 0.7 // Should be high
      },
      {
        text1: "Software Engineer with JavaScript experience",
        text2: "Chef with culinary arts background",
        expectedSimilarity: 0.2 // Should be low
      }
    ];
    
    let accurateTests = 0;
    const tolerance = 0.2;
    
    for (const test of similarityTests) {
      const embedding1 = await embeddingService.generateEmbedding(test.text1);
      const embedding2 = await embeddingService.generateEmbedding(test.text2);
      
      const { cosineSimilarity } = require('../cosine');
      const actualSimilarity = cosineSimilarity(embedding1, embedding2);
      
      if (Math.abs(actualSimilarity - test.expectedSimilarity) <= tolerance) {
        accurateTests++;
      }
    }
    
    return {
      accuracy: accurateTests / similarityTests.length,
      totalTests: similarityTests.length,
      accurateTests
    };
  }

  /**
   * Test skill extraction accuracy
   */
  async testSkillExtractionAccuracy() {
    console.log('🔍 Testing skill extraction accuracy...');
    
    const skillTests = [
      {
        text: "Experienced in JavaScript, React, Node.js, and MongoDB",
        expectedSkills: ["javascript", "react", "node.js", "mongodb"]
      },
      {
        text: "Proficient in Python, Django, PostgreSQL, and AWS",
        expectedSkills: ["python", "django", "postgresql", "aws"]
      }
    ];
    
    let totalSkills = 0;
    let correctlyExtracted = 0;
    
    for (const test of skillTests) {
      const extractedSkills = this.extractSkillsFromText(test.text);
      
      for (const expectedSkill of test.expectedSkills) {
        totalSkills++;
        if (extractedSkills.some(skill => 
          skill.toLowerCase().includes(expectedSkill.toLowerCase())
        )) {
          correctlyExtracted++;
        }
      }
    }
    
    return {
      accuracy: totalSkills > 0 ? correctlyExtracted / totalSkills : 0,
      totalSkills,
      correctlyExtracted
    };
  }

  /**
   * Test scoring algorithm consistency
   */
  async testScoringAlgorithm(testData) {
    console.log('🔍 Testing scoring algorithm...');
    
    // Test that better matches get higher scores
    const consistencyTests = [];
    
    // Create pairs of resumes where one is clearly better than the other
    const testPairs = this.createScoringTestPairs(testData);
    
    for (const pair of testPairs) {
      const score1 = await this.calculateMatchScore(pair.resume1, pair.job);
      const score2 = await this.calculateMatchScore(pair.resume2, pair.job);
      
      // The better resume should have a higher score
      const isConsistent = pair.betterResume === 1 ? score1 > score2 : score2 > score1;
      consistencyTests.push(isConsistent);
    }
    
    const consistentResults = consistencyTests.filter(Boolean).length;
    
    return {
      consistency: consistentResults / consistencyTests.length,
      totalTests: consistencyTests.length,
      consistentResults
    };
  }

  /**
   * Helper methods
   */
  loadResumeParsingTestCases() {
    // In a real implementation, you'd load actual test PDFs
    // For now, return empty array
    return [];
  }

  compareExtractedFields(parsed, expected) {
    let correct = 0;
    let total = 0;
    
    const fields = ['name', 'skills', 'experience', 'education'];
    
    for (const field of fields) {
      total++;
      if (parsed[field] && expected[field]) {
        // Simple similarity check - in practice, you'd use more sophisticated comparison
        const similarity = this.calculateStringSimilarity(parsed[field], expected[field]);
        if (similarity > 0.8) correct++;
      }
    }
    
    return { correct, total };
  }

  calculateStringSimilarity(str1, str2) {
    // Simple Jaccard similarity
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  extractSkillsFromText(text) {
    // Simple skill extraction - in practice, use your actual extraction logic
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'mongodb', 
      'postgresql', 'aws', 'django', 'express'
    ];
    
    return commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  createScoringTestPairs(testData) {
    // Create test pairs where one resume is clearly better than another
    // This is a simplified version - in practice, you'd create more sophisticated test cases
    return [];
  }

  async calculateMatchScore(resume, job) {
    // Use your existing matching algorithm
    // This is a placeholder - implement actual scoring logic
    return Math.random(); // Placeholder
  }

  /**
   * Generate final comprehensive report
   */
  generateFinalReport(accuracyReport, componentTests) {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        overallAccuracy: this.calculateOverallAccuracy(accuracyReport, componentTests),
        recommendationQuality: accuracyReport.metrics['precision@5'] || 0,
        systemReliability: this.calculateSystemReliability(componentTests)
      },
      detailedMetrics: accuracyReport,
      componentTests: componentTests,
      recommendations: this.generateRecommendations(accuracyReport, componentTests)
    };
  }

  calculateOverallAccuracy(accuracyReport, componentTests) {
    // Weighted average of different accuracy metrics
    const weights = {
      precision: 0.3,
      recall: 0.2,
      ndcg: 0.2,
      correlation: 0.15,
      components: 0.15
    };
    
    const precision = accuracyReport.metrics['precision@5'] || 0;
    const recall = accuracyReport.metrics['recall@5'] || 0;
    const ndcg = accuracyReport.metrics.ndcg || 0;
    const correlation = accuracyReport.metrics.correlation || 0;
    
    const componentAvg = Object.values(componentTests)
      .map(test => test.accuracy || 0)
      .reduce((a, b) => a + b, 0) / Object.keys(componentTests).length;
    
    return (
      precision * weights.precision +
      recall * weights.recall +
      ndcg * weights.ndcg +
      correlation * weights.correlation +
      componentAvg * weights.components
    );
  }

  calculateSystemReliability(componentTests) {
    // Average of component test accuracies
    const accuracies = Object.values(componentTests).map(test => test.accuracy || 0);
    return accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  }

  generateRecommendations(accuracyReport, componentTests) {
    const recommendations = [];
    
    if (accuracyReport.metrics['precision@5'] < 0.6) {
      recommendations.push("Consider improving the ranking algorithm to reduce false positives");
    }
    
    if (accuracyReport.metrics.correlation < 0.5) {
      recommendations.push("System scores don't correlate well with human judgment - review scoring weights");
    }
    
    if (componentTests.embeddings?.accuracy < 0.7) {
      recommendations.push("Consider using a more sophisticated embedding model");
    }
    
    if (componentTests.skillExtraction?.accuracy < 0.8) {
      recommendations.push("Improve skill extraction with better NLP techniques");
    }
    
    return recommendations;
  }

  /**
   * Save test results to file
   */
  saveTestResults(report) {
    const filename = `accuracy-test-results-${Date.now()}.json`;
    const filepath = path.join(__dirname, 'results', filename);
    
    // Ensure results directory exists
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Test results saved to ${filepath}`);
  }

  /**
   * Print summary of test results
   */
  printSummary(report) {
    console.log('\n📊 ACCURACY TEST SUMMARY');
    console.log('========================');
    console.log(`Overall Accuracy: ${(report.summary.overallAccuracy * 100).toFixed(1)}%`);
    console.log(`Recommendation Quality: ${(report.summary.recommendationQuality * 100).toFixed(1)}%`);
    console.log(`System Reliability: ${(report.summary.systemReliability * 100).toFixed(1)}%`);
    
    console.log('\n📈 Key Metrics:');
    console.log(`Precision@5: ${((report.detailedMetrics.metrics['precision@5'] || 0) * 100).toFixed(1)}%`);
    console.log(`Recall@5: ${((report.detailedMetrics.metrics['recall@5'] || 0) * 100).toFixed(1)}%`);
    console.log(`NDCG: ${((report.detailedMetrics.metrics.ndcg || 0) * 100).toFixed(1)}%`);
    console.log(`Correlation: ${((report.detailedMetrics.metrics.correlation || 0) * 100).toFixed(1)}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
  }
}

module.exports = AccuracyTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new AccuracyTestSuite();
  testSuite.runFullAccuracyTest().catch(console.error);
}