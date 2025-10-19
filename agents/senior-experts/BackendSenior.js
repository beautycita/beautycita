/**
 * Senior Backend Engineer - Marcus Chen
 *
 * Expert in Node.js, Express, PostgreSQL, and API architecture
 */

class BackendSenior {
  constructor() {
    this.name = 'Marcus Chen';
    this.role = 'Senior Backend Engineer';
    this.id = 'backend-senior';
  }

  /**
   * Review API endpoint design
   */
  reviewEndpoint(endpoint) {
    const issues = [];
    const suggestions = [];

    // Check for proper HTTP methods
    if (endpoint.method === 'GET' && endpoint.hasBody) {
      issues.push({
        severity: 'high',
        message: 'GET requests should not have a request body',
        category: 'REST Design'
      });
    }

    // Check for authentication
    if (!endpoint.requiresAuth && endpoint.path.includes('/user/')) {
      suggestions.push({
        severity: 'high',
        message: 'User-specific endpoints should require authentication',
        category: 'Security'
      });
    }

    // Check for input validation
    if (!endpoint.hasValidation) {
      issues.push({
        severity: 'high',
        message: 'Endpoint lacks input validation',
        category: 'Validation',
        fix: 'Use express-validator or joi for input validation'
      });
    }

    // Check for error handling
    if (!endpoint.hasErrorHandling) {
      issues.push({
        severity: 'high',
        message: 'No error handling middleware detected',
        category: 'Error Handling'
      });
    }

    // Check for rate limiting
    if (endpoint.path.includes('/api/') && !endpoint.hasRateLimiting) {
      suggestions.push({
        severity: 'medium',
        message: 'Consider adding rate limiting to prevent abuse',
        category: 'Security'
      });
    }

    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      issues,
      suggestions,
      score: this.calculateScore(issues, suggestions)
    };
  }

  /**
   * Generate API endpoint template
   */
  generateEndpoint(name, method = 'GET', requiresAuth = false) {
    const authMiddleware = requiresAuth ? 'authenticateToken, ' : '';

    return `/**
 * ${method} ${name}
 * @description Add endpoint description here
 */
router.${method.toLowerCase()}('/${name}', ${authMiddleware}async (req, res) => {
  try {
    // Input validation
    const { error, value } = validateInput(req.${method === 'GET' ? 'query' : 'body'});
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    // Business logic
    const result = await performOperation(value);

    // Response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in ${name}:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
`;
  }

  /**
   * Suggest database query optimization
   */
  optimizeQuery(query) {
    const suggestions = [];

    // Check for N+1 queries
    if (query.includes('forEach') && query.includes('query')) {
      suggestions.push({
        priority: 'high',
        issue: 'Potential N+1 query problem',
        suggestion: 'Use JOIN or batch queries instead of individual queries in a loop',
        example: `// Instead of:\nfor (const item of items) {\n  await db.query('SELECT ...');\n}\n\n// Use:\nconst result = await db.query('SELECT ... JOIN ...');`
      });
    }

    // Check for SELECT *
    if (query.includes('SELECT *')) {
      suggestions.push({
        priority: 'medium',
        issue: 'Using SELECT * can be inefficient',
        suggestion: 'Select only the columns you need',
        example: `SELECT id, name, email FROM users`
      });
    }

    // Check for missing WHERE clause in UPDATE/DELETE
    if ((query.includes('UPDATE') || query.includes('DELETE')) && !query.includes('WHERE')) {
      suggestions.push({
        priority: 'critical',
        issue: 'UPDATE/DELETE without WHERE clause',
        suggestion: 'Always use WHERE clause to prevent accidental bulk operations'
      });
    }

    // Check for proper indexing
    if (query.includes('WHERE') && !query.includes('INDEX')) {
      suggestions.push({
        priority: 'medium',
        issue: 'Ensure columns in WHERE clause are indexed',
        suggestion: 'Add indexes on frequently queried columns',
        example: `CREATE INDEX idx_users_email ON users(email);`
      });
    }

    return suggestions;
  }

  /**
   * Security audit for API routes
   */
  auditSecurity(routes) {
    const findings = [];

    routes.forEach(route => {
      // Check authentication
      if (!route.hasAuth && !route.path.includes('/public/')) {
        findings.push({
          severity: 'high',
          route: route.path,
          issue: 'Missing authentication',
          recommendation: 'Add JWT authentication middleware'
        });
      }

      // Check rate limiting
      if (!route.hasRateLimiting) {
        findings.push({
          severity: 'medium',
          route: route.path,
          issue: 'No rate limiting',
          recommendation: 'Add express-rate-limit middleware'
        });
      }

      // Check input validation
      if (!route.hasValidation) {
        findings.push({
          severity: 'high',
          route: route.path,
          issue: 'No input validation',
          recommendation: 'Add input validation using express-validator'
        });
      }
    });

    return {
      totalRoutes: routes.length,
      findings,
      securityScore: Math.max(0, 100 - (findings.length * 10))
    };
  }

  /**
   * Calculate endpoint quality score
   */
  calculateScore(issues, suggestions) {
    let score = 100;

    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 30;
      if (issue.severity === 'high') score -= 20;
      if (issue.severity === 'medium') score -= 10;
      if (issue.severity === 'low') score -= 5;
    });

    suggestions.forEach(suggestion => {
      if (suggestion.severity === 'high') score -= 10;
      if (suggestion.severity === 'medium') score -= 5;
    });

    return Math.max(0, score);
  }

  /**
   * Generate middleware template
   */
  generateMiddleware(name, type = 'authentication') {
    const templates = {
      authentication: `
/**
 * ${name} Middleware
 * Validates JWT token and attaches user to request
 */
const ${name} = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};`,
      validation: `
/**
 * ${name} Middleware
 * Validates request input
 */
const ${name} = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    req.validatedData = value;
    next();
  };
};`,
      rateLimiting: `
/**
 * ${name} Middleware
 * Rate limiting to prevent abuse
 */
const ${name} = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});`
    };

    return templates[type] || templates.authentication;
  }
}

module.exports = BackendSenior;
