const axios = require('axios');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

/**
 * Service to communicate with the Python PyTorch AI Model Microservice
 */
class AIService {
  /**
   * Health check for downstream Python AI Model service
   */
  static async checkAIHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
      return {
        online: true,
        data: response.data
      };
    } catch (error) {
      logger.warn(`AI Service health check failed at ${AI_SERVICE_URL}: ${error.message}`);
      return {
        online: false,
        error: error.message
      };
    }
  }

  /**
   * Send validated image to the Python PyTorch AI Model for inference
   * @param {Object} validatedImage - Object containing base64, buffer, mimeType, width, height
   * @returns {Object} Normalized AI prediction result
   */
  static async predictSkinLesion(validatedImage) {
    try {
      const payload = {
        image: validatedImage.base64
      };

      const response = await axios.post(`${AI_SERVICE_URL}/predict`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000 // 20s timeout for model inference
      });

      const aiData = response.data;
      if (!aiData || !aiData.success) {
        throw new Error(aiData?.error || 'Inference failed on AI model');
      }

      // Extract and normalize diagnosis
      const predictionTier = aiData.prediction || 'Not Cancer'; // 'Cancer' | 'Potential Cancer' | 'Not Cancer'
      const rawConfidence = typeof aiData.confidence === 'number' ? aiData.confidence : 0.85;
      const confidencePercent = Math.min(100, Math.max(1, Math.round(rawConfidence * 100)));

      // Map risk level
      let riskLevel = 'Low';
      let resultStatus = 'benign';
      let recommendation = 'No immediate action required. Monitor lesion for changes.';

      if (predictionTier === 'Cancer') {
        riskLevel = 'High';
        resultStatus = 'malignant';
        recommendation = 'Urgent: Clinical signs of malignancy detected. Please book an immediate consultation with a dermatologist.';
      } else if (predictionTier === 'Potential Cancer') {
        riskLevel = 'Medium';
        resultStatus = 'malignant'; // Saved as high-attention lesion in database
        recommendation = 'Atypical characteristics identified. We recommend scheduling a formal dermatoscopy evaluation.';
      }

      // Top diagnosis condition name (e.g. Melanoma, Melanocytic Nevus, etc.)
      const conditionName = aiData.top_diagnosis?.name || 
        (predictionTier === 'Cancer' ? 'Malignant Lesion' : predictionTier === 'Potential Cancer' ? 'Atypical Pre-Malignancy' : 'Benign Nevus');

      return {
        success: true,
        prediction: predictionTier,
        condition: conditionName,
        confidence: confidencePercent,
        confidenceFormatted: `${confidencePercent}%`,
        riskLevel,
        result: resultStatus,
        risk_color: aiData.risk_color || (riskLevel === 'High' ? '#ff6b6b' : riskLevel === 'Medium' ? '#ffd166' : '#4ade80'),
        recommendation,
        top_diagnosis: aiData.top_diagnosis || null,
        all_probabilities: aiData.all_probabilities || {},
        fine_grained_probabilities: aiData.fine_grained_probabilities || {},
        thresholds_applied: aiData.thresholds_applied || {},
        image_url: aiData.image_url || null
      };

    } catch (error) {
      logger.error(`AI Model prediction error: ${error.message}`);
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        throw new Error(`AI Model service is offline or unreachable at ${AI_SERVICE_URL}. Please ensure the Python service is running.`);
      }
      throw error;
    }
  }
}

module.exports = AIService;
