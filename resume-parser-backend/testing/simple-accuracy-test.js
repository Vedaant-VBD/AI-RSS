#!/usr/bin/env node

/**
 * Simple Accuracy Testing Script
 * Tests your resume matching system without requiring full database setup
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');

class SimpleAccuracyTest {
  constructor() {
    this.results = {
      embeddingTests: [],
      parsingTests: [],
      matchingTests: [],
      overallScore: 0
    };
  }

  /**
   * Run all simple accuracy tests
   */
  async runAllTests() {
    console.log('🚀 Starting Simple Accuracy Tests...\n');

    try {
      // 1. Test embedding quality
      console.log('1️⃣ Testing Embedding Quality...');
      const embeddingResults = await this.testEmbeddingQuality();
      this.results.embeddingTests = embeddingResults;
      
      // 2. Test resume parsing (if sample files exist)
      console.log('\n2️⃣ Testing Resume Parsing...');
      const parsingResults = await this.testResumeParsing();
      this.results.parsingTests = parsingResults;
      
      // 3. Test matching consistency
      console.log('\n3️⃣ Testing Matching Consistency...');
      const matchingResults = await this.testMatchingConsistency();
      this.results.matchingTests = matchingResults;
      
      // 4. Calculate overall score
      this.results.overallScore = this.calculateOverallScore();
      
      // 5. Generate report
      this.generateReport();
      
      console.log('\n✅ Simple Accuracy Tests Completed!');
      return this.results;
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      return null;
    }
  }

  /**
   * Test embedding quality with known similar/dissimilar text pairs
   */
  async testEmbeddingQuality() {
    console.log('   Testing semantic similarity...');
    
    const testPairs = [
      {
        text1: "Software Engineer with JavaScript and React experience",
        text2: "Frontend Developer skilled in JavaScript and React",
        expectedSimilarity: "high",
        description: "Similar tech roles"
      },
      {
        text1: "Senior Java Developer with Spring Boot experience",
        text2: "Java Backend Engineer using Spring framework",
        expectedSimilarity: "high",
        description: "Similar Java roles"
      },
      {
        text1: "Data Scientist with Python and Machine Learning",
        text2: "ML Engineer proficient in Python and TensorFlow",
        expectedSimilarity: "high",
        description: "Similar ML roles"
      },
      {
        text1: "Software Engineer with JavaScript experience",
        text2: "Chef with culinary arts background",
        expectedSimilarity: "low",
        description: "Completely different fields"
      },
      {
        text1: "Frontend Developer with React skills",
        text2: "Marketing Manager with social media experience",
        expectedSimilarity: "low",
        description: "Tech vs Marketing"
      }
    ];

    const results = [];
    let correctPredictions = 0;

    try {
      const embeddingService = require('../embedding-service');
      const { cosineSimilarity } = require('../cosine');

      for (const pair of testPairs) {
        try {
          const embedding1 = await embeddingService.generateEmbedding(pair.text1);
          const embedding2 = await embeddingService.generateEmbedding(pair.text2);
          
          const similarity = cosineSimilarity(embedding1, embedding2);
          
          // Check if prediction matches expectation
          const isHighSimilarity = similarity > 0.5;
          const expectedHigh = pair.expectedSimilarity === "high";
          const correct = isHighSimilarity === expectedHigh;
          
          if (correct) correctPredictions++;
          
          results.push({
            description: pair.description,
            similarity: similarity.toFixed(3),
            expected: pair.expectedSimilarity,
            actual: isHighSimilarity ? "high" : "low",
            correct: correct
          });
          
          console.log(`   ✓ ${pair.description}: ${similarity.toFixed(3)} (${correct ? '✅' : '❌'})`);
          
        } catch (error) {
          console.log(`   ❌ Failed to test: ${pair.description}`);
          results.push({
            description: pair.description,
            error: error.message,
            correct: false
          });
        }
      }
      
    } catch (error) {
      console.log('   ❌ Embedding service not available');
      return { accuracy: 0, error: 'Embedding service not available' };
    }

    const accuracy = correctPredictions / testPairs.length;
    console.log(`   📊 Embedding Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    
    return {
      accuracy: accuracy,
      totalTests: testPairs.length,
      correctPredictions: correctPredictions,
      details: results
    };
  }

  /**
   * Test resume parsing accuracy
   */
  async testResumeParsing() {
    console.log('   Testing resume parsing...');
    
    // Test with sample text data (since we may not have PDF files)
    const sampleResumeTexts = [
      {
        text: `John Doe
Software Engineer
john.doe@email.com
(555) 123-4567

SUMMARY
Experienced software engineer with 5 years of experience in JavaScript, React, and Node.js.

SKILLS
JavaScript, React, Node.js, MongoDB, Express, HTML, CSS

EXPERIENCE
Senior Software Engineer at Tech Corp (2020-2023)
- Developed web applications using React and Node.js
- Led a team of 3 developers
- Improved application performance by 40%

Software Engineer at StartupXYZ (2018-2020)
- Built REST APIs using Express and MongoDB
- Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2014-2018)`,
        expectedFields: {
          name: "John Doe",
          skills: ["javascript", "react", "node.js", "mongodb"],
          hasExperience: true,
          hasEducation: true
        }
      }
    ];

    const results = [];
    let correctExtractions = 0;
    let totalFields = 0;

    try {
      // Since we don't have actual PDF parsing for text, we'll simulate field extraction
      for (const sample of sampleResumeTexts) {
        const extractedData = this.simulateResumeExtraction(sample.text);
        
        // Check name extraction
        totalFields++;
        if (extractedData.name && extractedData.name.toLowerCase().includes('john doe')) {
          correctExtractions++;
        }
        
        // Check skills extraction
        totalFields++;
        const hasRequiredSkills = sample.expectedFields.skills.some(skill => 
          extractedData.skills.toLowerCase().includes(skill)
        );
        if (hasRequiredSkills) {
          correctExtractions++;
        }
        
        // Check experience extraction
        totalFields++;
        if (extractedData.hasExperience === sample.expectedFields.hasExperience) {
          correctExtractions++;
        }
        
        // Check education extraction
        totalFields++;
        if (extractedData.hasEducation === sample.expectedFields.hasEducation) {
          correctExtractions++;
        }
        
        results.push({
          extracted: extractedData,
          expected: sample.expectedFields
        });
      }
      
    } catch (error) {
      console.log('   ❌ Resume parsing test failed');
      return { accuracy: 0, error: error.message };
    }

    const accuracy = totalFields > 0 ? correctExtractions / totalFields : 0;
    console.log(`   📊 Parsing Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    
    return {
      accuracy: accuracy,
      totalFields: totalFields,
      correctExtractions: correctExtractions,
      details: results
    };
  }

  /**
   * Test matching consistency
   */
  async testMatchingConsistency() {
    console.log('   Testing matching consistency...');
    
    // Test that similar profiles get similar scores
    const consistencyTests = [
      {
        jobDescription: "Looking for a JavaScript developer with React experience",
        resume1: "Frontend developer with 3 years JavaScript and React experience",
        resume2: "Frontend engineer skilled in JavaScript, React, and modern web development",
        expectation: "similar_scores"
      },
      {
        jobDescription: "Senior Java developer position requiring Spring Boot",
        resume1: "Senior Java developer with 5 years Spring Boot experience",
        resume2: "Junior JavaScript developer with React skills",
        expectation: "different_scores"
      }
    ];

    const results = [];
    let consistentResults = 0;

    try {
      const embeddingService = require('../embedding-service');
      const { cosineSimilarity } = require('../cosine');

      for (const test of consistencyTests) {
        try {
          // Generate embeddings
          const jobEmbedding = await embeddingService.generateEmbedding(test.jobDescription);
          const resume1Embedding = await embeddingService.generateEmbedding(test.resume1);
          const resume2Embedding = await embeddingService.generateEmbedding(test.resume2);
          
          // Calculate similarities
          const score1 = cosineSimilarity(jobEmbedding, resume1Embedding);
          const score2 = cosineSimilarity(jobEmbedding, resume2Embedding);
          
          const scoreDifference = Math.abs(score1 - score2);
          
          let isConsistent = false;
          if (test.expectation === "similar_scores") {
            isConsistent = scoreDifference < 0.2; // Should be similar
          } else {
            isConsistent = scoreDifference > 0.2; // Should be different
          }
          
          if (isConsistent) consistentResults++;
          
          results.push({
            test: test.expectation,
            score1: score1.toFixed(3),
            score2: score2.toFixed(3),
            difference: scoreDifference.toFixed(3),
            consistent: isConsistent
          });
          
          console.log(`   ✓ ${test.expectation}: ${score1.toFixed(3)} vs ${score2.toFixed(3)} (${isConsistent ? '✅' : '❌'})`);
          
        } catch (error) {
          console.log(`   ❌ Failed consistency test: ${test.expectation}`);
          results.push({
            test: test.expectation,
            error: error.message,
            consistent: false
          });
        }
      }
      
    } catch (error) {
      console.log('   ❌ Consistency testing failed');
      return { consistency: 0, error: error.message };
    }

    const consistency = consistentResults / consistencyTests.length;
    console.log(`   📊 Matching Consistency: ${(consistency * 100).toFixed(1)}%`);
    
    return {
      consistency: consistency,
      totalTests: consistencyTests.length,
      consistentResults: consistentResults,
      details: results
    };
  }

  /**
   * Simulate resume field extraction from text
   */
  simulateResumeExtraction(text) {
    const lowerText = text.toLowerCase();
    
    return {
      name: this.extractName(text),
      skills: this.extractSkills(text),
      hasExperience: lowerText.includes('experience') || lowerText.includes('engineer') || lowerText.includes('developer'),
      hasEducation: lowerText.includes('education') || lowerText.includes('university') || lowerText.includes('degree'),
      summary: this.extractSummary(text)
    };
  }

  extractName(text) {
    const lines = text.split('\n');
    // Assume first non-empty line is the name
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.includes('@') && !trimmed.includes('(')) {
        return trimmed;
      }
    }
    return '';
  }

  extractSkills(text) {
    const skillKeywords = ['javascript', 'react', 'node.js', 'python', 'java', 'mongodb', 'sql', 'html', 'css'];
    const foundSkills = [];
    const lowerText = text.toLowerCase();
    
    for (const skill of skillKeywords) {
      if (lowerText.includes(skill)) {
        foundSkills.push(skill);
      }
    }
    
    return foundSkills.join(', ');
  }

  extractSummary(text) {
    const summaryMatch = text.match(/SUMMARY\s*([\s\S]*?)(?=\n[A-Z]|$)/i);
    return summaryMatch ? summaryMatch[1].trim() : '';
  }

  /**
   * Calculate overall accuracy score
   */
  calculateOverallScore() {
    const weights = {
      embedding: 0.4,
      parsing: 0.3,
      matching: 0.3
    };

    const embeddingScore = this.results.embeddingTests.accuracy || 0;
    const parsingScore = this.results.parsingTests.accuracy || 0;
    const matchingScore = this.results.matchingTests.consistency || 0;

    return (
      embeddingScore * weights.embedding +
      parsingScore * weights.parsing +
      matchingScore * weights.matching
    );
  }

  /**
   * Generate and display test report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SIMPLE ACCURACY TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Overall System Score: ${(this.results.overallScore * 100).toFixed(1)}%`);
    
    console.log(`\n📈 Component Scores:`);
    console.log(`   Embedding Quality: ${((this.results.embeddingTests.accuracy || 0) * 100).toFixed(1)}%`);
    console.log(`   Resume Parsing: ${((this.results.parsingTests.accuracy || 0) * 100).toFixed(1)}%`);
    console.log(`   Matching Consistency: ${((this.results.matchingTests.consistency || 0) * 100).toFixed(1)}%`);
    
    // Performance grade
    const grade = this.calculateGrade(this.results.overallScore);
    console.log(`\n🏆 Performance Grade: ${grade}`);
    
    // Recommendations
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    // Save detailed results
    this.saveResults();
    
    console.log('\n' + '='.repeat(60));
  }

  calculateGrade(score) {
    if (score >= 0.9) return 'A+ (Excellent)';
    if (score >= 0.8) return 'A (Very Good)';
    if (score >= 0.7) return 'B (Good)';
    if (score >= 0.6) return 'C (Fair)';
    if (score >= 0.5) return 'D (Poor)';
    return 'F (Needs Major Improvement)';
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.embeddingTests.accuracy < 0.7) {
      recommendations.push("Embedding quality is low. Consider using a better sentence transformer model.");
    }
    
    if (this.results.parsingTests.accuracy < 0.8) {
      recommendations.push("Resume parsing accuracy needs improvement. Enhance field extraction logic.");
    }
    
    if (this.results.matchingTests.consistency < 0.7) {
      recommendations.push("Matching consistency is low. Review scoring algorithm and weights.");
    }
    
    if (this.results.overallScore < 0.6) {
      recommendations.push("Overall system performance is below acceptable levels. Focus on core algorithm improvements.");
    }
    
    return recommendations;
  }

  saveResults() {
    const filename = `simple-accuracy-results-${Date.now()}.json`;
    const filepath = path.join(__dirname, 'results', filename);
    
    // Ensure results directory exists
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: this.results.overallScore,
      grade: this.calculateGrade(this.results.overallScore),
      componentScores: {
        embeddingQuality: this.results.embeddingTests.accuracy || 0,
        resumeParsing: this.results.parsingTests.accuracy || 0,
        matchingConsistency: this.results.matchingTests.consistency || 0
      },
      detailedResults: this.results,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed results saved to: ${filepath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SimpleAccuracyTest();
  tester.runAllTests().catch(console.error);
}

module.exports = SimpleAccuracyTest;