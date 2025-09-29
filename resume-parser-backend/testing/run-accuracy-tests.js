#!/usr/bin/env node

/**
 * Quick Start Accuracy Testing Script
 * Run this to get immediate accuracy insights
 */

const AccuracyTestSuite = require('./accuracy-test-suite');
const ABTestingFramework = require('./ab-testing');
const { UserFeedbackSystem } = require('./user-feedback');

async function runQuickAccuracyTest() {
  console.log('🚀 Starting Quick Accuracy Test...\n');

  try {
    // 1. Run basic accuracy tests
    console.log('1️⃣ Running Basic Accuracy Tests...');
    const testSuite = new AccuracyTestSuite();
    const basicResults = await testSuite.runFullAccuracyTest();
    
    // 2. Run A/B tests on scoring algorithms
    console.log('\n2️⃣ Running A/B Tests...');
    const abTesting = new ABTestingFramework();
    const abResults = await abTesting.testScoringAlgorithms();
    
    // 3. Analyze user feedback (if available)
    console.log('\n3️⃣ Analyzing User Feedback...');
    const feedbackSystem = new UserFeedbackSystem();
    const feedbackResults = await feedbackSystem.generateAccuracyReport();
    
    // 4. Generate comprehensive report
    console.log('\n4️⃣ Generating Comprehensive Report...');
    const comprehensiveReport = {
      timestamp: new Date().toISOString(),
      testSummary: {
        basicAccuracy: basicResults.summary.overallAccuracy,
        abTestWinner: abResults.analysis.winner,
        userSatisfaction: feedbackResults.summary.userSatisfaction,
        systemReliability: basicResults.summary.systemReliability
      },
      detailedResults: {
        basicTests: basicResults,
        abTests: abResults,
        userFeedback: feedbackResults
      },
      overallRecommendations: generateOverallRecommendations(basicResults, abResults, feedbackResults)
    };
    
    // 5. Save and display results
    saveResults(comprehensiveReport);
    displaySummary(comprehensiveReport);
    
    return comprehensiveReport;
    
  } catch (error) {
    console.error('❌ Accuracy testing failed:', error);
    process.exit(1);
  }
}

function generateOverallRecommendations(basicResults, abResults, feedbackResults) {
  const recommendations = [];
  
  // From basic tests
  if (basicResults.summary.overallAccuracy < 0.7) {
    recommendations.push("🔧 Overall system accuracy is below 70%. Focus on improving core matching algorithm.");
  }
  
  // From A/B tests
  if (abResults.analysis.significantDifference) {
    recommendations.push(`📊 A/B test shows ${abResults.analysis.winner} performs significantly better. Consider implementing this variant.`);
  }
  
  // From user feedback
  if (feedbackResults.summary.userSatisfaction < 3.5) {
    recommendations.push("👥 User satisfaction is low. Collect more feedback and adjust matching criteria.");
  }
  
  // Performance recommendations
  if (basicResults.detailedMetrics.metrics['precision@5'] < 0.6) {
    recommendations.push("🎯 Precision@5 is low. Too many irrelevant matches in top results.");
  }
  
  if (basicResults.detailedMetrics.metrics.correlation < 0.5) {
    recommendations.push("📈 Low correlation between system scores and human judgment. Review scoring weights.");
  }
  
  return recommendations;
}

function saveResults(report) {
  const fs = require('fs');
  const path = require('path');
  
  const filename = `comprehensive-accuracy-report-${Date.now()}.json`;
  const filepath = path.join(__dirname, 'results', filename);
  
  // Ensure results directory exists
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Comprehensive report saved to: ${filepath}`);
}

function displaySummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE ACCURACY REPORT SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 Overall System Performance:`);
  console.log(`   Basic Accuracy: ${(report.testSummary.basicAccuracy * 100).toFixed(1)}%`);
  console.log(`   System Reliability: ${(report.testSummary.systemReliability * 100).toFixed(1)}%`);
  console.log(`   User Satisfaction: ${report.testSummary.userSatisfaction.toFixed(1)}/5.0`);
  
  if (report.testSummary.abTestWinner) {
    console.log(`   A/B Test Winner: ${report.testSummary.abTestWinner}`);
  }
  
  console.log(`\n📈 Key Metrics:`);
  const metrics = report.detailedResults.basicTests.detailedMetrics.metrics;
  console.log(`   Precision@5: ${((metrics['precision@5'] || 0) * 100).toFixed(1)}%`);
  console.log(`   Recall@5: ${((metrics['recall@5'] || 0) * 100).toFixed(1)}%`);
  console.log(`   NDCG: ${((metrics.ndcg || 0) * 100).toFixed(1)}%`);
  console.log(`   Correlation: ${((metrics.correlation || 0) * 100).toFixed(1)}%`);
  
  if (report.overallRecommendations.length > 0) {
    console.log(`\n💡 Top Recommendations:`);
    report.overallRecommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  // Performance grade
  const grade = calculatePerformanceGrade(report.testSummary.basicAccuracy);
  console.log(`\n🏆 Overall Performance Grade: ${grade}`);
  
  console.log('\n' + '='.repeat(60));
}

function calculatePerformanceGrade(accuracy) {
  if (accuracy >= 0.9) return 'A+ (Excellent)';
  if (accuracy >= 0.8) return 'A (Very Good)';
  if (accuracy >= 0.7) return 'B (Good)';
  if (accuracy >= 0.6) return 'C (Fair)';
  if (accuracy >= 0.5) return 'D (Poor)';
  return 'F (Needs Major Improvement)';
}

// Run the test if this script is executed directly
if (require.main === module) {
  runQuickAccuracyTest().catch(console.error);
}

module.exports = { runQuickAccuracyTest };