const fs = require('fs').promises;
const path = require('path');
const { query } = require('../db');

const PATTERN_FILE = path.join(__dirname, '../../data/aphrodite-patterns.json');
const MIN_CONFIDENCE = 0.95;
const MIN_SAMPLES = 20;

// In-memory cache
let patternCache = {};
let lastLoaded = null;
const CACHE_DURATION = 3600000; // 1 hour

/**
 * Initialize pattern database
 */
async function initPatternDB() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(PATTERN_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Try to load existing patterns
    try {
      const data = await fs.readFile(PATTERN_FILE, 'utf8');
      patternCache = JSON.parse(data);
      lastLoaded = Date.now();
      console.log(`✅ Loaded ${Object.keys(patternCache).length} area code patterns from file`);
    } catch (err) {
      // File doesn't exist yet, start with empty
      patternCache = {};
      await savePatternDB();
      console.log('✅ Initialized empty pattern database');
    }
  } catch (error) {
    console.error('❌ Failed to initialize pattern database:', error);
    patternCache = {};
  }
}

/**
 * Save pattern database to file
 */
async function savePatternDB() {
  try {
    await fs.writeFile(PATTERN_FILE, JSON.stringify(patternCache, null, 2), 'utf8');
    console.log(`✅ Saved ${Object.keys(patternCache).length} area code patterns to file`);
  } catch (error) {
    console.error('❌ Failed to save pattern database:', error);
  }
}

/**
 * Get prediction for an area code
 * Returns { shouldUseAI, predictedCountryCode, confidence, reasoning } or { shouldUseAI: false, reason }
 */
function getAreaCodePrediction(areaCode) {
  const patterns = patternCache[areaCode];

  if (!patterns || Object.keys(patterns).length === 0) {
    return {
      shouldUseAI: false,
      reason: `No historical data for area code ${areaCode}`
    };
  }

  // Calculate success rates for each country code
  const predictions = Object.entries(patterns).map(([countryCode, stats]) => ({
    countryCode,
    attempts: stats.attempts || 0,
    successes: stats.successes || 0,
    failures: stats.failures || 0,
    successRate: stats.attempts > 0 ? stats.successes / stats.attempts : 0
  }));

  // Find highest success rate
  const best = predictions.sort((a, b) => b.successRate - a.successRate)[0];

  // Check minimum sample size
  if (best.attempts < MIN_SAMPLES) {
    return {
      shouldUseAI: false,
      reason: `Only ${best.attempts} samples for area code ${areaCode}, need ${MIN_SAMPLES} minimum`
    };
  }

  // Check confidence threshold
  if (best.successRate < MIN_CONFIDENCE) {
    return {
      shouldUseAI: false,
      reason: `Confidence ${(best.successRate * 100).toFixed(1)}% < ${MIN_CONFIDENCE * 100}% threshold for area code ${areaCode}`
    };
  }

  // Passed both gates!
  return {
    shouldUseAI: true,
    predictedCountryCode: best.countryCode,
    confidence: best.successRate,
    sampleSize: best.attempts,
    reasoning: `Area code ${areaCode}: ${best.successes}/${best.attempts} (${(best.successRate * 100).toFixed(1)}%) succeeded with ${best.countryCode}`
  };
}

/**
 * Update patterns from database (run periodically)
 */
async function updatePatternsFromDB() {
  try {
    console.log('🔄 Updating Aphrodite patterns from database...');

    // Get all verification attempts from last 30 days
    const results = await query(`
      SELECT
        area_code,
        attempted_country_code,
        COUNT(*) as attempts,
        COUNT(*) FILTER (WHERE success = true) as successes,
        COUNT(*) FILTER (WHERE success = false) as failures
      FROM verification_attempts
      WHERE created_at > NOW() - INTERVAL '30 days'
        AND area_code IS NOT NULL
        AND attempted_country_code IS NOT NULL
      GROUP BY area_code, attempted_country_code
      HAVING COUNT(*) >= 5
      ORDER BY area_code, attempted_country_code
    `);

    // Build new pattern cache
    const newPatterns = {};

    for (const row of results.rows) {
      const { area_code, attempted_country_code, attempts, successes, failures } = row;

      if (!newPatterns[area_code]) {
        newPatterns[area_code] = {};
      }

      newPatterns[area_code][attempted_country_code] = {
        attempts: parseInt(attempts),
        successes: parseInt(successes),
        failures: parseInt(failures),
        lastUpdated: new Date().toISOString()
      };
    }

    // Update cache and save to file
    patternCache = newPatterns;
    lastLoaded = Date.now();
    await savePatternDB();

    console.log(`✅ Updated patterns for ${Object.keys(patternCache).length} area codes`);

    // Log high-confidence predictions
    const highConfidence = Object.entries(patternCache)
      .map(([areaCode, patterns]) => ({ areaCode, prediction: getAreaCodePrediction(areaCode) }))
      .filter(item => item.prediction.shouldUseAI);

    console.log(`📊 ${highConfidence.length} area codes have ≥95% confidence predictions`);

    return {
      totalAreaCodes: Object.keys(patternCache).length,
      highConfidenceAreaCodes: highConfidence.length
    };

  } catch (error) {
    console.error('❌ Failed to update patterns from database:', error);
    throw error;
  }
}

/**
 * Get all patterns (for analytics/debugging)
 */
function getAllPatterns() {
  return patternCache;
}

/**
 * Get statistics about pattern database
 */
function getPatternStats() {
  const totalAreaCodes = Object.keys(patternCache).length;
  let highConfidence = 0;
  let totalAttempts = 0;
  let totalSuccesses = 0;

  Object.entries(patternCache).forEach(([areaCode, patterns]) => {
    const prediction = getAreaCodePrediction(areaCode);
    if (prediction.shouldUseAI) {
      highConfidence++;
    }

    Object.values(patterns).forEach(stats => {
      totalAttempts += stats.attempts || 0;
      totalSuccesses += stats.successes || 0;
    });
  });

  return {
    totalAreaCodes,
    highConfidenceAreaCodes: highConfidence,
    totalAttempts,
    totalSuccesses,
    overallSuccessRate: totalAttempts > 0 ? totalSuccesses / totalAttempts : 0,
    lastUpdated: lastLoaded ? new Date(lastLoaded).toISOString() : null
  };
}

module.exports = {
  initPatternDB,
  savePatternDB,
  getAreaCodePrediction,
  updatePatternsFromDB,
  getAllPatterns,
  getPatternStats
};
