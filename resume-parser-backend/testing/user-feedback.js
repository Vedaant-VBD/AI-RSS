/**
 * User Feedback Collection System
 * Collect and analyze user feedback on match quality
 */

const mongoose = require('mongoose');

// Feedback schema
const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeId: { type: String, required: true },
  systemScore: { type: Number, required: true },
  userRating: { type: Number, min: 1, max: 5, required: true },
  relevanceRating: { type: Number, min: 1, max: 5, required: true },
  skillsMatch: { type: Number, min: 1, max: 5 },
  experienceMatch: { type: Number, min: 1, max: 5 },
  wouldInterview: { type: Boolean },
  feedback: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

class UserFeedbackSystem {
  constructor() {
    this.feedbackData = [];
  }

  /**
   * Collect feedback from users
   */
  async collectFeedback(feedbackData) {
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    
    console.log(`📝 Feedback collected for job ${feedbackData.jobId}`);
    return feedback;
  }

  /**
   * Add feedback collection to your existing match endpoint
   */
  addFeedbackEndpoint(app) {
    // Add this to your main index.js
    app.post('/feedback', async (req, res) => {
      try {
        const {
          jobId,
          resumeId,
          systemScore,
          userRating,
          relevanceRating,
          skillsMatch,
          experienceMatch,
          wouldInterview,
          feedback
        } = req.body;

        const feedbackDoc = await this.collectFeedback({
          userId: req.user.userId, // From JWT
          jobId,
          resumeId,
          systemScore,
          userRating,
          relevanceRating,
          skillsMatch,
          experienceMatch,
          wouldInterview,
          feedback
        });

        res.json({ message: 'Feedback recorded successfully', id: feedbackDoc._id });
      } catch (error) {
        console.error('Feedback collection error:', error);
        res.status(500).json({ error: 'Failed to record feedback' });
      }
    });
  }

  /**
   * Analyze feedback to measure accuracy
   */
  async analyzeFeedback() {
    const feedbacks = await Feedback.find().populate('jobId');
    
    const analysis = {
      totalFeedbacks: feedbacks.length,
      averageUserRating: 0,
      averageRelevanceRating: 0,
      correlationWithSystemScore: 0,
      interviewRate: 0,
      feedbackByScore: {},
      recommendations: []
    };

    if (feedbacks.length === 0) {
      return analysis;
    }

    // Calculate averages
    analysis.averageUserRating = this.average(feedbacks.map(f => f.userRating));
    analysis.averageRelevanceRating = this.average(feedbacks.map(f => f.relevanceRating));
    
    // Calculate interview rate
    const interviewFeedbacks = feedbacks.filter(f => f.wouldInterview !== null);
    if (interviewFeedbacks.length > 0) {
      analysis.interviewRate = interviewFeedbacks.filter(f => f.wouldInterview).length / interviewFeedbacks.length;
    }

    // Calculate correlation between system score and user rating
    const systemScores = feedbacks.map(f => f.systemScore);
    const userRatings = feedbacks.map(f => f.userRating);
    analysis.correlationWithSystemScore = this.calculateCorrelation(systemScores, userRatings);

    // Group feedback by system score ranges
    analysis.feedbackByScore = this.groupFeedbackByScore(feedbacks);

    // Generate recommendations
    analysis.recommendations = this.generateFeedbackRecommendations(analysis);

    return analysis;
  }

  /**
   * Group feedback by system score ranges
   */
  groupFeedbackByScore(feedbacks) {
    const ranges = {
      'high (0.8-1.0)': [],
      'medium (0.5-0.8)': [],
      'low (0.0-0.5)': []
    };

    feedbacks.forEach(feedback => {
      if (feedback.systemScore >= 0.8) {
        ranges['high (0.8-1.0)'].push(feedback);
      } else if (feedback.systemScore >= 0.5) {
        ranges['medium (0.5-0.8)'].push(feedback);
      } else {
        ranges['low (0.0-0.5)'].push(feedback);
      }
    });

    // Calculate statistics for each range
    const result = {};
    Object.keys(ranges).forEach(range => {
      const feedbacksInRange = ranges[range];
      if (feedbacksInRange.length > 0) {
        result[range] = {
          count: feedbacksInRange.length,
          avgUserRating: this.average(feedbacksInRange.map(f => f.userRating)),
          avgRelevanceRating: this.average(feedbacksInRange.map(f => f.relevanceRating)),
          interviewRate: feedbacksInRange.filter(f => f.wouldInterview).length / feedbacksInRange.length
        };
      }
    });

    return result;
  }

  /**
   * Generate recommendations based on feedback analysis
   */
  generateFeedbackRecommendations(analysis) {
    const recommendations = [];

    if (analysis.correlationWithSystemScore < 0.5) {
      recommendations.push("Low correlation between system scores and user ratings. Consider adjusting the scoring algorithm.");
    }

    if (analysis.averageUserRating < 3.0) {
      recommendations.push("Low average user rating. The matching quality needs improvement.");
    }

    if (analysis.interviewRate < 0.3) {
      recommendations.push("Low interview rate suggests matches aren't meeting user expectations.");
    }

    // Check if high-scoring matches are actually good
    const highScoreFeedback = analysis.feedbackByScore['high (0.8-1.0)'];
    if (highScoreFeedback && highScoreFeedback.avgUserRating < 3.5) {
      recommendations.push("High-scoring matches are receiving low user ratings. Review scoring criteria.");
    }

    return recommendations;
  }

  /**
   * Create feedback collection UI component
   */
  generateFeedbackComponent() {
    return `
// Add this React component to your frontend
const FeedbackModal = ({ match, jobId, onSubmit, onClose }) => {
  const [ratings, setRatings] = useState({
    userRating: 0,
    relevanceRating: 0,
    skillsMatch: 0,
    experienceMatch: 0,
    wouldInterview: null,
    feedback: ''
  });

  const handleSubmit = async () => {
    const feedbackData = {
      jobId,
      resumeId: match.resume._id,
      systemScore: match.score,
      ...ratings
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        onSubmit();
        onClose();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="feedback-modal">
      <h3>Rate this match</h3>
      
      <div className="rating-section">
        <label>Overall Match Quality:</label>
        <StarRating 
          value={ratings.userRating} 
          onChange={(value) => setRatings({...ratings, userRating: value})}
        />
      </div>

      <div className="rating-section">
        <label>Relevance to Job:</label>
        <StarRating 
          value={ratings.relevanceRating} 
          onChange={(value) => setRatings({...ratings, relevanceRating: value})}
        />
      </div>

      <div className="rating-section">
        <label>Skills Match:</label>
        <StarRating 
          value={ratings.skillsMatch} 
          onChange={(value) => setRatings({...ratings, skillsMatch: value})}
        />
      </div>

      <div className="rating-section">
        <label>Experience Match:</label>
        <StarRating 
          value={ratings.experienceMatch} 
          onChange={(value) => setRatings({...ratings, experienceMatch: value})}
        />
      </div>

      <div className="rating-section">
        <label>Would you interview this candidate?</label>
        <div>
          <button 
            onClick={() => setRatings({...ratings, wouldInterview: true})}
            className={ratings.wouldInterview === true ? 'selected' : ''}
          >
            Yes
          </button>
          <button 
            onClick={() => setRatings({...ratings, wouldInterview: false})}
            className={ratings.wouldInterview === false ? 'selected' : ''}
          >
            No
          </button>
        </div>
      </div>

      <div className="rating-section">
        <label>Additional Comments:</label>
        <textarea 
          value={ratings.feedback}
          onChange={(e) => setRatings({...ratings, feedback: e.target.value})}
          placeholder="Any additional feedback about this match..."
        />
      </div>

      <div className="modal-actions">
        <button onClick={handleSubmit}>Submit Feedback</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
    `;
  }

  /**
   * Generate accuracy report based on user feedback
   */
  async generateAccuracyReport() {
    const feedbackAnalysis = await this.analyzeFeedback();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeedbacks: feedbackAnalysis.totalFeedbacks,
        userSatisfaction: feedbackAnalysis.averageUserRating,
        matchRelevance: feedbackAnalysis.averageRelevanceRating,
        systemAccuracy: feedbackAnalysis.correlationWithSystemScore,
        interviewConversionRate: feedbackAnalysis.interviewRate
      },
      detailedAnalysis: feedbackAnalysis,
      accuracyMetrics: {
        // Convert user ratings to accuracy percentages
        overallAccuracy: (feedbackAnalysis.averageUserRating / 5) * 100,
        relevanceAccuracy: (feedbackAnalysis.averageRelevanceRating / 5) * 100,
        systemCorrelation: feedbackAnalysis.correlationWithSystemScore * 100
      },
      recommendations: feedbackAnalysis.recommendations
    };

    return report;
  }

  // Helper methods
  average(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

module.exports = { UserFeedbackSystem, Feedback };
    `;
  }
}

module.exports = { UserFeedbackSystem, Feedback };