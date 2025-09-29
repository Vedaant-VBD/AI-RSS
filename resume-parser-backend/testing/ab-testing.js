/**
 * A/B Testing Framework for Resume Matching System
 * Compare different algorithms and configurations
 */

class ABTestingFramework {
  constructor() {
    this.experiments = new Map();
    this.results = new Map();
  }

  /**
   * Define an A/B test experiment
   */
  defineExperiment(experimentId, config) {
    this.experiments.set(experimentId, {
      id: experimentId,
      name: config.name,
      description: config.description,
      variants: config.variants, // Array of algorithm variants
      trafficSplit: config.trafficSplit || [0.5, 0.5], // How to split traffic
      metrics: config.metrics || ['precision', 'recall', 'user_satisfaction'],
      startDate: new Date(),
      status: 'active'
    });
  }

  /**
   * Test different scoring algorithms
   */
  async testScoringAlgorithms() {
    this.defineExperiment('scoring_algorithm_v1', {
      name: 'Scoring Algorithm Comparison',
      description: 'Compare current scoring vs. weighted scoring',
      variants: [
        {
          name: 'current',
          config: {
            embeddingWeight: 0.6,
            skillWeight: 0.3,
            contentWeight: 0.1
          }
        },
        {
          name: 'weighted',
          config: {
            embeddingWeight: 0.4,
            skillWeight: 0.4,
            contentWeight: 0.2
          }
        }
      ]
    });

    const testResults = await this.runExperiment('scoring_algorithm_v1');
    return testResults;
  }

  /**
   * Test different embedding models
   */
  async testEmbeddingModels() {
    this.defineExperiment('embedding_models_v1', {
      name: 'Embedding Model Comparison',
      description: 'Compare different sentence transformer models',
      variants: [
        { name: 'current', model: 'all-MiniLM-L6-v2' },
        { name: 'improved', model: 'all-mpnet-base-v2' }
      ]
    });

    return await this.runExperiment('embedding_models_v1');
  }

  /**
   * Run an A/B test experiment
   */
  async runExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    console.log(`🧪 Running A/B test: ${experiment.name}`);
    
    // Load test data
    const testData = await this.loadTestData();
    const groundTruth = await this.loadGroundTruth();
    
    const variantResults = [];
    
    // Test each variant
    for (const variant of experiment.variants) {
      console.log(`Testing variant: ${variant.name}`);
      
      const variantResult = await this.testVariant(variant, testData, groundTruth);
      variantResults.push({
        variant: variant.name,
        ...variantResult
      });
    }
    
    // Analyze results
    const analysis = this.analyzeResults(variantResults);
    
    // Store results
    this.results.set(experimentId, {
      experiment,
      variantResults,
      analysis,
      completedAt: new Date()
    });
    
    return this.results.get(experimentId);
  }

  /**
   * Test a specific variant
   */
  async testVariant(variant, testData, groundTruth) {
    const results = {
      totalTests: 0,
      precision: [],
      recall: [],
      ndcg: [],
      processingTime: [],
      userSatisfaction: []
    };

    for (const job of testData.jobs) {
      const startTime = Date.now();
      
      // Apply variant configuration
      const matches = await this.getMatchesWithVariant(job, variant);
      
      const processingTime = Date.now() - startTime;
      results.processingTime.push(processingTime);
      
      // Calculate metrics for this job
      const jobGroundTruth = groundTruth.filter(gt => gt.jobId === job._id.toString());
      
      if (jobGroundTruth.length > 0) {
        const precision = this.calculatePrecision(matches, jobGroundTruth, 5);
        const recall = this.calculateRecall(matches, jobGroundTruth, 5);
        const ndcg = this.calculateNDCG(matches, jobGroundTruth, 10);
        
        results.precision.push(precision);
        results.recall.push(recall);
        results.ndcg.push(ndcg);
        results.totalTests++;
      }
    }

    // Calculate averages
    return {
      avgPrecision: this.average(results.precision),
      avgRecall: this.average(results.recall),
      avgNDCG: this.average(results.ndcg),
      avgProcessingTime: this.average(results.processingTime),
      totalTests: results.totalTests
    };
  }

  /**
   * Get matches using specific variant configuration
   */
  async getMatchesWithVariant(job, variant) {
    // This would modify your matching algorithm based on the variant
    // For now, we'll simulate different results
    
    if (variant.config) {
      // Temporarily modify scoring weights
      const originalWeights = this.getCurrentWeights();
      this.setWeights(variant.config);
      
      try {
        const response = await fetch(`http://localhost:4000/jobs/${job._id}/match`);
        const matches = await response.json();
        return matches;
      } finally {
        // Restore original weights
        this.setWeights(originalWeights);
      }
    }
    
    // Default behavior
    const response = await fetch(`http://localhost:4000/jobs/${job._id}/match`);
    return await response.json();
  }

  /**
   * Analyze A/B test results
   */
  analyzeResults(variantResults) {
    const analysis = {
      winner: null,
      confidence: 0,
      significantDifference: false,
      metrics: {}
    };

    // Compare variants pairwise
    if (variantResults.length === 2) {
      const [variantA, variantB] = variantResults;
      
      // Statistical significance test (simplified t-test)
      const precisionPValue = this.tTest(
        variantA.precision || [variantA.avgPrecision],
        variantB.precision || [variantB.avgPrecision]
      );
      
      analysis.significantDifference = precisionPValue < 0.05;
      analysis.confidence = 1 - precisionPValue;
      
      // Determine winner based on multiple metrics
      const scoreA = this.calculateCompositeScore(variantA);
      const scoreB = this.calculateCompositeScore(variantB);
      
      analysis.winner = scoreA > scoreB ? variantA.variant : variantB.variant;
      
      analysis.metrics = {
        precisionImprovement: ((variantB.avgPrecision - variantA.avgPrecision) / variantA.avgPrecision * 100).toFixed(2) + '%',
        recallImprovement: ((variantB.avgRecall - variantA.avgRecall) / variantA.avgRecall * 100).toFixed(2) + '%',
        speedImprovement: ((variantA.avgProcessingTime - variantB.avgProcessingTime) / variantA.avgProcessingTime * 100).toFixed(2) + '%'
      };
    }

    return analysis;
  }

  /**
   * Calculate composite score for variant comparison
   */
  calculateCompositeScore(variant) {
    return (
      variant.avgPrecision * 0.4 +
      variant.avgRecall * 0.3 +
      variant.avgNDCG * 0.2 +
      (1 / variant.avgProcessingTime) * 1000 * 0.1 // Inverse of processing time
    );
  }

  /**
   * Simple t-test for statistical significance
   */
  tTest(sample1, sample2) {
    const mean1 = this.average(sample1);
    const mean2 = this.average(sample2);
    const var1 = this.variance(sample1);
    const var2 = this.variance(sample2);
    const n1 = sample1.length;
    const n2 = sample2.length;
    
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVar * (1/n1 + 1/n2));
    
    const tStat = Math.abs(mean1 - mean2) / standardError;
    
    // Simplified p-value calculation (for demonstration)
    // In practice, you'd use a proper statistical library
    return Math.max(0.01, 1 / (1 + tStat * tStat));
  }

  /**
   * Generate A/B test report
   */
  generateReport(experimentId) {
    const result = this.results.get(experimentId);
    if (!result) {
      throw new Error(`No results found for experiment ${experimentId}`);
    }

    const report = {
      experiment: result.experiment.name,
      duration: result.completedAt - result.experiment.startDate,
      variants: result.variantResults.map(vr => ({
        name: vr.variant,
        precision: `${(vr.avgPrecision * 100).toFixed(1)}%`,
        recall: `${(vr.avgRecall * 100).toFixed(1)}%`,
        ndcg: `${(vr.avgNDCG * 100).toFixed(1)}%`,
        avgProcessingTime: `${vr.avgProcessingTime.toFixed(0)}ms`,
        totalTests: vr.totalTests
      })),
      analysis: result.analysis,
      recommendation: this.generateRecommendation(result.analysis)
    };

    return report;
  }

  generateRecommendation(analysis) {
    if (!analysis.significantDifference) {
      return "No statistically significant difference found. Continue with current implementation.";
    }

    if (analysis.confidence > 0.95) {
      return `Strong evidence that ${analysis.winner} performs better. Recommend implementing this variant.`;
    } else if (analysis.confidence > 0.8) {
      return `Moderate evidence that ${analysis.winner} performs better. Consider running a longer test.`;
    } else {
      return "Weak evidence of difference. Recommend running a longer test with more data.";
    }
  }

  // Helper methods
  async loadTestData() {
    // Load your test jobs and resumes
    // This is a placeholder - implement actual dat a loading
    return { jobs: [], resumes: [] };
  }

  async loadGroundTruth() {
    // Load ground truth annotations
    return [];
  }

  getCurrentWeights() {
    // Get current algorithm weights
    return {
      embeddingWeight: 0.6,
      skillWeight: 0.3,
      contentWeight: 0.1
    };
  }

  setWeights(weights) {
    // Temporarily modify algorithm weights
    // This would require modifying your matching algorithm
    console.log('Setting weights:', weights);
  }

  calculatePrecision(matches, groundTruth, k) {
    // Implement precision calculation
    return Math.random(); // Placeholder
  }

  calculateRecall(matches, groundTruth, k) {
    // Implement recall calculation
    return Math.random(); // Placeholder
  }

  calculateNDCG(matches, groundTruth, k) {
    // Implement NDCG calculation
    return Math.random(); // Placeholder
  }

  average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  variance(arr) {
    const mean = this.average(arr);
    return this.average(arr.map(x => (x - mean) ** 2));
  }
}

module.exports = ABTestingFramework;