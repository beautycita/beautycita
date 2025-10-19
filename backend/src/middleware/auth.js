const jwt = require('jsonwebtoken');
const { query } = require('../db');

// JWT middleware to validate token
const validateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret');

    // Set req.user object for compatibility with routes expecting req.user.id
    req.user = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      name: decoded.name,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      profileComplete: decoded.profileComplete
    };

    // Also set individual properties for backward compatibility
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = {
  validateJWT
};