const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');
const {
  generateChatResponse,
  getOrCreateConversation,
  getConversationHistory,
  generateStylistRecommendations,
  generateMarketInsights
} = require('../services/aphroditeAI');

/**
 * POST /api/aphrodite/chat
 * Chat with Aphrodite AI
 */
router.post('/chat', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { message, sessionId, conversationType, language } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(
      userId,
      sessionId,
      conversationType || 'general'
    );

    // Get conversation history
    const history = await getConversationHistory(conversation.id);

    // Generate AI response
    const aiResponse = await generateChatResponse(
      conversation.id,
      message,
      history,
      language || 'en'
    );

    res.json({
      success: true,
      data: {
        message: aiResponse.message,
        conversationId: conversation.id,
        sessionId: conversation.session_id
      }
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message'
    });
  }
});

/**
 * GET /api/aphrodite/conversation/:sessionId
 * Get conversation history
 */
router.get('/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversationResult = await query(`
      SELECT * FROM ai_conversations WHERE session_id = $1
    `, [sessionId]);

    if (conversationResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          messages: []
        }
      });
    }

    const conversation = conversationResult.rows[0];
    const history = await getConversationHistory(conversation.id);

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messages: history
      }
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving conversation'
    });
  }
});

/**
 * POST /api/aphrodite/recommendations/stylists
 * Get AI-powered stylist recommendations
 */
router.post('/recommendations/stylists', async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences, location } = req.body;

    // Get user's stored preferences if not provided
    let userPrefs = preferences;
    if (!userPrefs) {
      const prefsResult = await query(`
        SELECT * FROM ai_user_preferences WHERE user_id = $1
      `, [userId]);

      if (prefsResult.rows.length > 0) {
        const storedPrefs = prefsResult.rows[0];
        userPrefs = {
          preferred_services: storedPrefs.preferred_services,
          preferred_price_range: storedPrefs.preferred_price_range,
          style_preferences: storedPrefs.style_preferences,
          location: location
        };
      } else {
        userPrefs = { location: location };
      }
    }

    // Get available stylists
    const stylistsResult = await query(`
      SELECT
        s.id,
        s.business_name,
        s.specialties,
        s.experience_years,
        s.location_city,
        s.location_state,
        s.base_price_range,
        sr.average_rating as rating_average,
        sr.total_reviews
      FROM stylists s
      LEFT JOIN stylist_ratings sr ON s.id = sr.stylist_id
      WHERE s.is_active = true
      ORDER BY sr.average_rating DESC NULLS LAST
      LIMIT 20
    `);

    const stylists = stylistsResult.rows;

    // Generate AI recommendations
    const recommendations = await generateStylistRecommendations(
      userId,
      userPrefs,
      stylists
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations'
    });
  }
});

/**
 * GET /api/aphrodite/recommendations/my-recommendations
 * Get user's active recommendations
 */
router.get('/recommendations/my-recommendations', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT
        r.*,
        s.business_name as stylist_name,
        s.specialties,
        s.location_city,
        sr.average_rating,
        sr.total_reviews
      FROM ai_recommendations r
      LEFT JOIN stylists s ON r.recommended_stylist_id = s.id
      LEFT JOIN stylist_ratings sr ON s.id = sr.stylist_id
      WHERE r.user_id = $1
        AND (r.expires_at IS NULL OR r.expires_at > NOW())
        AND r.user_feedback IS NULL
      ORDER BY r.confidence_score DESC, r.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recommendations'
    });
  }
});

/**
 * POST /api/aphrodite/recommendations/:id/feedback
 * Provide feedback on recommendation
 */
router.post('/recommendations/:id/feedback', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { feedback, clicked, booked } = req.body;

    await query(`
      UPDATE ai_recommendations
      SET
        user_feedback = $1,
        was_clicked = COALESCE($2, was_clicked),
        was_booked = COALESCE($3, was_booked),
        interacted_at = NOW()
      WHERE id = $4 AND user_id = $5
    `, [feedback, clicked, booked, id, userId]);

    res.json({
      success: true,
      message: 'Feedback recorded'
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording feedback'
    });
  }
});

/**
 * GET /api/aphrodite/trends
 * Get current beauty trends
 */
router.get('/trends', async (req, res) => {
  try {
    const { category, region, limit = 10 } = req.query;

    let whereClause = 'WHERE is_active = true';
    const params = [limit];

    if (category) {
      params.push(category);
      whereClause += ` AND trend_category = $${params.length}`;
    }

    if (region) {
      params.push(region);
      whereClause += ` AND region = $${params.length}`;
    }

    const result = await query(`
      SELECT *
      FROM beauty_trends
      ${whereClause}
      ORDER BY popularity_score DESC
      LIMIT $1
    `, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving trends'
    });
  }
});

/**
 * GET /api/aphrodite/insights/stylist
 * Get market insights for stylist
 */
router.get('/insights/stylist', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist ID
    const stylistResult = await query(`
      SELECT id FROM stylists WHERE user_id = $1
    `, [userId]);

    if (stylistResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only stylists can access insights'
      });
    }

    const stylistId = stylistResult.rows[0].id;

    // Get active insights
    const result = await query(`
      SELECT *
      FROM market_insights
      WHERE stylist_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        created_at DESC
      LIMIT 20
    `, [stylistId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving insights'
    });
  }
});

/**
 * POST /api/aphrodite/insights/:id/action
 * Mark insight as acted upon
 */
router.post('/insights/:id/action', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const checkResult = await query(`
      SELECT mi.id
      FROM market_insights mi
      INNER JOIN stylists s ON mi.stylist_id = s.id
      WHERE mi.id = $1 AND s.user_id = $2
    `, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    await query(`
      UPDATE market_insights
      SET was_acted_on = true, was_viewed = true
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Insight marked as acted upon'
    });
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating insight'
    });
  }
});

/**
 * POST /api/aphrodite/onboarding/suggest-bio
 * Generate professional bio based on stylist info
 */
router.post('/onboarding/suggest-bio', validateJWT, async (req, res) => {
  try {
    const { businessName, specialties, experience } = req.body;

    if (!businessName || !specialties || specialties.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Business name and specialties are required'
      });
    }

    // Create a prompt for bio generation
    const specialtiesList = Array.isArray(specialties) ? specialties.join(', ') : specialties;
    const yearsText = experience > 1 ? `${experience} years` : experience === 1 ? '1 year' : 'less than a year';

    const prompt = `Write a professional, engaging bio for a beauty professional with the following details:
    - Business Name: ${businessName}
    - Specialties: ${specialtiesList}
    - Experience: ${yearsText}

    The bio should be:
    - 50-150 words
    - Professional yet warm and approachable
    - Highlight their expertise and passion
    - Appeal to potential clients
    - Written in first person

    Do not include the business name in the bio. Just write the bio text.`;

    // Simple bio generation (in production, this would call OpenAI or similar)
    const generatedBio = `With ${yearsText} of experience in ${specialtiesList.toLowerCase()}, I'm passionate about helping clients look and feel their absolute best. My approach combines technical expertise with a genuine care for each person who sits in my chair. I believe beauty is about enhancing your natural confidence and creating looks that make you feel amazing. Whether you're preparing for a special event or just want to treat yourself, I'm here to provide personalized service in a welcoming, professional environment. Let's work together to bring your beauty vision to life!`;

    res.json({
      success: true,
      bio: generatedBio,
      message: 'Bio generated successfully'
    });

  } catch (error) {
    console.error('Error generating bio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bio'
    });
  }
});

/**
 * POST /api/aphrodite/onboarding/suggest-pricing
 * Get pricing suggestions based on location, experience, and services
 */
router.post('/onboarding/suggest-pricing', validateJWT, async (req, res) => {
  try {
    const { service, city, experience, specialty } = req.body;

    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required'
      });
    }

    // Base pricing by service type (Mexican Pesos)
    const basePricing = {
      'haircut': { min: 200, max: 800, suggested: 400 },
      'hair coloring': { min: 800, max: 3000, suggested: 1500 },
      'makeup': { min: 300, max: 1500, suggested: 700 },
      'manicure': { min: 150, max: 500, suggested: 300 },
      'pedicure': { min: 200, max: 600, suggested: 400 },
      'facial': { min: 400, max: 1500, suggested: 800 },
      'waxing': { min: 150, max: 800, suggested: 350 },
      'eyelash extensions': { min: 500, max: 2000, suggested: 1000 }
    };

    const serviceKey = service.toLowerCase();
    let pricing = basePricing[serviceKey] || { min: 300, max: 1000, suggested: 500 };

    // Adjust for experience
    const experienceMultiplier = 1 + (Math.min(experience || 0, 10) * 0.05);
    pricing.suggested = Math.round(pricing.suggested * experienceMultiplier);

    // Adjust for city (Mexico City premium)
    if (city && city.toLowerCase().includes('mexico city')) {
      pricing.suggested = Math.round(pricing.suggested * 1.2);
    }

    res.json({
      success: true,
      pricing: {
        service,
        currency: 'MXN',
        suggestedPrice: pricing.suggested,
        priceRange: {
          min: pricing.min,
          max: pricing.max
        },
        marketInsight: `Based on ${experience || 0} years of experience in ${city || 'your area'}, we recommend pricing around $${pricing.suggested} MXN for ${service}.`
      }
    });

  } catch (error) {
    console.error('Error suggesting pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest pricing'
    });
  }
});

/**
 * POST /api/aphrodite/onboarding/suggest-services
 * Recommend services based on specialties
 */
router.post('/onboarding/suggest-services', validateJWT, async (req, res) => {
  try {
    const { specialties } = req.body;

    if (!specialties || specialties.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Specialties are required'
      });
    }

    // Service recommendations by specialty
    const servicesBySpecialty = {
      'Hair Styling': ['Haircut - Women', 'Haircut - Men', 'Blowdry & Styling', 'Hair Treatment', 'Updo'],
      'Hair Coloring': ['Full Color', 'Highlights', 'Balayage', 'Ombre', 'Root Touch-up', 'Color Correction'],
      'Makeup': ['Everyday Makeup', 'Bridal Makeup', 'Special Event Makeup', 'Makeup Lesson'],
      'Nails': ['Manicure', 'Pedicure', 'Gel Nails', 'Acrylic Nails', 'Nail Art'],
      'Skincare': ['Facial', 'Deep Cleansing Facial', 'Anti-Aging Treatment', 'Acne Treatment'],
      'Massage': ['Relaxation Massage', 'Deep Tissue Massage', 'Facial Massage'],
      'Waxing': ['Eyebrow Waxing', 'Facial Waxing', 'Body Waxing', 'Brazilian Wax'],
      'Eyelashes': ['Classic Lash Extensions', 'Volume Lash Extensions', 'Lash Lift & Tint'],
      'Eyebrows': ['Eyebrow Shaping', 'Eyebrow Tinting', 'Microblading']
    };

    const recommendedServices = [];
    specialties.forEach(specialty => {
      if (servicesBySpecialty[specialty]) {
        recommendedServices.push(...servicesBySpecialty[specialty]);
      }
    });

    // Remove duplicates
    const uniqueServices = [...new Set(recommendedServices)];

    res.json({
      success: true,
      recommendedServices: uniqueServices.slice(0, 12), // Limit to 12 suggestions
      message: `Found ${uniqueServices.length} services matching your specialties`
    });

  } catch (error) {
    console.error('Error suggesting services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest services'
    });
  }
});

/**
 * POST /api/aphrodite/onboarding/analyze-portfolio
 * Provide feedback on portfolio images
 */
router.post('/onboarding/analyze-portfolio', validateJWT, async (req, res) => {
  try {
    const { imageCount, specialties } = req.body;

    if (!imageCount) {
      return res.status(400).json({
        success: false,
        message: 'Image count is required'
      });
    }

    const feedback = [];

    if (imageCount < 3) {
      feedback.push({
        type: 'warning',
        message: 'Add at least 3 portfolio images to meet approval requirements'
      });
    } else if (imageCount < 6) {
      feedback.push({
        type: 'suggestion',
        message: 'Consider adding more images to showcase variety in your work'
      });
    } else {
      feedback.push({
        type: 'success',
        message: 'Great portfolio! You have a good variety of images'
      });
    }

    // Specialty-specific suggestions
    if (specialties && specialties.includes('Hair Coloring')) {
      feedback.push({
        type: 'tip',
        message: 'Include before/after shots of hair coloring transformations'
      });
    }

    if (specialties && specialties.includes('Makeup')) {
      feedback.push({
        type: 'tip',
        message: 'Showcase different makeup styles (natural, glam, bridal)'
      });
    }

    res.json({
      success: true,
      feedback,
      score: Math.min(100, (imageCount / 6) * 100),
      message: 'Portfolio analysis complete'
    });

  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze portfolio'
    });
  }
});

module.exports = router;