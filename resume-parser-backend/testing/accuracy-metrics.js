/**
 * Accuracy Metrics Calculator
 * Compares system predictions with human annotations
 */

class AccuracyMetrics {
  constructor() {
    this.metrics = {
      precision: 0,
      recall: 0,
      f1Score: 0,
      ndcg: 0,
      meanReciprocalRank: 0,
      correlationCoefficient: 0
    };
  }

  /**
   * Calculate Precision@K - How many of top K results are relevant
   */
  calculatePrecisionAtK(systemRanking, groundTruth, k = 5) {
    const topK = systemRanking.slice(0, k);
    const relevantInTopK = topK.filter(item => 
      this.isRelevant(item, groundTruth)
    ).length;
    
    return relevantInTopK / k;
  }

  /**
   * Calculate Recall@K - How many relevant items are in top K
   */
  calculateRecallAtK(systemRanking, groundTruth, k = 5) {
    const topK = systemRanking.slice(0, k);
    const totalRelevant = groundTruth.filter(item => 
      item.relevanceLevel === 'excellent' || item.relevanceLevel === 'good'
    ).length;
    
    if (totalRelevant === 0) return 0;
    
    const relevantInTopK = topK.filter(item => 
      this.isRelevant(item, groundTruth)
    ).length;
    
    return relevantInTopK / totalRelevant;
  }

  /**
   * Calculate F1 Score
   */
  calculateF1Score(precision, recall) {
    if (precision + recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
  }

  /**
   * Calculate NDCG (Normalized Discounted Cumulative Gain)
   */
  calculateNDCG(systemRanking, groundTruth, k = 10) {
    const dcg = this.calculateDCG(systemRanking, groundTruth, k);
    const idcg = this.calculateIDCG(groundTruth, k);
    
    return idcg === 0 ? 0 : dcg / idcg;
  }

  calculateDCG(ranking, groundTruth, k) {
    let dcg = 0;
    for (let i = 0; i < Math.min(k, ranking.length); i++) {
      const relevanceScore = this.getRelevanceScore(ranking[i], groundTruth);
      dcg += (Math.pow(2, relevanceScore) - 1) / Math.log2(i + 2);
    }
    return dcg;
  }

  calculateIDCG(groundTruth, k) {
    const sortedRelevance = groundTruth
      .map(item => this.getRelevanceScoreFromAnnotation(item))
      .sort((a, b) => b - a);
    
    let idcg = 0;
    for (let i = 0; i < Math.min(k, sortedRelevance.length); i++) {
      idcg += (Math.pow(2, sortedRelevance[i]) - 1) / Math.log2(i + 2);
    }
    return idcg;
  }

  /**
   * Calculate Mean Reciprocal Rank
   */
  calculateMRR(systemRankings, groundTruths) {
    let totalRR = 0;
    let validQueries = 0;

    for (let i = 0; i < systemRankings.length; i++) {
      const ranking = systemRankings[i];
      const groundTruth = groundTruths[i];
      
      const firstRelevantRank = this.findFirstRelevantRank(ranking, groundTruth);
      if (firstRelevantRank > 0) {
        totalRR += 1 / firstRelevantRank;
        validQueries++;
      }
    }

    return validQueries === 0 ? 0 : totalRR / validQueries;
  }

  /**
   * Calculate correlation between system scores and human scores
   */
  calculateCorrelation(systemScores, humanScores) {
    if (systemScores.length !== humanScores.length) {
      throw new Error('Score arrays must have same length');
    }

    const n = systemScores.length;
    const sumX = systemScores.reduce((a, b) => a + b, 0);
    const sumY = humanScores.reduce((a, b) => a + b, 0);
    const sumXY = systemScores.reduce((sum, x, i) => sum + x * humanScores[i], 0);
    const sumX2 = systemScores.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = humanScores.reduce((sum, y) => sum + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Helper methods
   */
  isRelevant(systemItem, groundTruth) {
    const annotation = groundTruth.find(gt => 
      gt.resumeId === systemItem.resume._id
    );
    return annotation && 
           (annotation.relevanceLevel === 'excellent' || 
            annotation.relevanceLevel === 'good');
  }

  getRelevanceScore(systemItem, groundTruth) {
    const annotation = groundTruth.find(gt => 
      gt.resumeId === systemItem.resume._id
    );
    
    if (!annotation) return 0;
    
    const scoreMap = {
      'excellent': 4,
      'good': 3,
      'fair': 2,
      'poor': 1,
      'irrelevant': 0
    };
    
    return scoreMap[annotation.relevanceLevel] || 0;
  }

  getRelevanceScoreFromAnnotation(annotation) {
    const scoreMap = {
      'excellent': 4,
      'good': 3,
      'fair': 2,
      'poor': 1,
      'irrelevant': 0
    };
    
    return scoreMap[annotation.relevanceLevel] || 0;
  }

  findFirstRelevantRank(ranking, groundTruth) {
    for (let i = 0; i < ranking.length; i++) {
      if (this.isRelevant(ranking[i], groundTruth)) {
        return i + 1; // Rank is 1-indexed
      }
    }
    return 0; // No relevant item found
  }

  /**
   * Generate comprehensive accuracy report
   */
  generateAccuracyReport(systemResults, groundTruthAnnotations) {
    const report = {
      timestamp: new Date().toISOString(),
      totalJobs: systemResults.length,
      totalAnnotations: groundTruthAnnotations.length,
      metrics: {}
    };

    // Calculate metrics for different K values
    const kValues = [1, 3, 5, 10];
    
    for (const k of kValues) {
      const precisions = [];
      const recalls = [];
      
      for (let i = 0; i < systemResults.length; i++) {
        const systemRanking = systemResults[i];
        const jobGroundTruth = groundTruthAnnotations.filter(gt => 
          gt.jobId === systemRanking.jobId
        );
        
        const precision = this.calculatePrecisionAtK(systemRanking.matches, jobGroundTruth, k);
        const recall = this.calculateRecallAtK(systemRanking.matches, jobGroundTruth, k);
        
        precisions.push(precision);
        recalls.push(recall);
      }
      
      const avgPrecision = precisions.reduce((a, b) => a + b, 0) / precisions.length;
      const avgRecall = recalls.reduce((a, b) => a + b, 0) / recalls.length;
      const f1 = this.calculateF1Score(avgPrecision, avgRecall);
      
      report.metrics[`precision@${k}`] = avgPrecision;
      report.metrics[`recall@${k}`] = avgRecall;
      report.metrics[`f1@${k}`] = f1;
    }

    // Calculate NDCG
    const ndcgScores = [];
    for (let i = 0; i < systemResults.length; i++) {
      const systemRanking = systemResults[i];
      const jobGroundTruth = groundTruthAnnotations.filter(gt => 
        gt.jobId === systemRanking.jobId
      );
      
      const ndcg = this.calculateNDCG(systemRanking.matches, jobGroundTruth);
      ndcgScores.push(ndcg);
    }
    report.metrics.ndcg = ndcgScores.reduce((a, b) => a + b, 0) / ndcgScores.length;

    // Calculate correlation
    const systemScores = [];
    const humanScores = [];
    
    for (const annotation of groundTruthAnnotations) {
      // Find corresponding system score
      const systemResult = systemResults.find(sr => sr.jobId === annotation.jobId);
      if (systemResult) {
        const systemMatch = systemResult.matches.find(m => 
          m.resume._id === annotation.resumeId
        );
        if (systemMatch) {
          systemScores.push(systemMatch.score);
          humanScores.push(annotation.overallMatch);
        }
      }
    }
    
    if (systemScores.length > 0) {
      report.metrics.correlation = this.calculateCorrelation(systemScores, humanScores);
    }

    return report;
  }
}

module.exports = AccuracyMetrics;