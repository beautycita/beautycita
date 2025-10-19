const express = require('express');
const router = express.Router();
const { query } = require('../db');
const rateLimit = require('express-rate-limit');
const btcpayService = require('../btcpayService');

// Store previous network stats for bandwidth calculation
let previousNetworkStats = {
  rx: 0,
  tx: 0,
  timestamp: Date.now()
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole;
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges'
      });
    }

    next();
  };
};

// Check if user can modify target user based on role hierarchy
const canModifyUser = (currentUserRole, targetUserRole) => {
  const roleHierarchy = {
    'SUPERADMIN': 4,
    'ADMIN': 3,
    'STYLIST': 2,
    'CLIENT': 1
  };

  return roleHierarchy[currentUserRole] > roleHierarchy[targetUserRole];
};

// Check if stylist has pending payouts
const hasPendingPayouts = async (userId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM payout_requests WHERE user_id = $1 AND status IN (\'PENDING\', \'APPROVED\', \'PROCESSING\')',
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking pending payouts:', error);
    return false;
  }
};

// Rate limiting for admin endpoints - more restrictive
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per 15 minutes
  message: {
    error: 'Too many admin verification attempts, please try again later.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for username verification
const usernameVerificationLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit to 3 attempts per 5 minutes per IP
  message: {
    error: 'Too many username verification attempts, please try again later.',
    code: 'USERNAME_VERIFICATION_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/admin/verify-username
 * Verify if a username exists and has ADMIN role
 * Public endpoint but heavily rate-limited
 */
router.post('/verify-username', usernameVerificationLimit, async (req, res) => {
  try {
    const { username } = req.body;

    // Validate input
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Normalize username (convert to lowercase, trim)
    const normalizedUsername = username.toLowerCase().trim();

    let queryText;
    let queryParam;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Query database for admin user by email
    queryText = `
      SELECT id, email, role, name, is_active, email_verified
      FROM users
      WHERE LOWER(email) = $1
      AND role = 'ADMIN'
      AND is_active = true
      AND email_verified = true
    `;
    queryParam = normalizedUsername;

    const result = await query(queryText, [queryParam]);

    if (result.rows.length > 0) {
      const adminUser = result.rows[0];

      // Log the verification attempt (for security auditing)
      console.log(`Admin username verification: ${normalizedUsername} - FOUND`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        adminUserId: adminUser.id
      });

      return res.json({
        success: true,
        exists: true,
        message: 'Admin user found'
      });
    } else {
      // Log failed verification attempt
      console.log(`Admin username verification: ${normalizedUsername} - NOT FOUND`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        exists: false,
        message: 'Admin user not found'
      });
    }

  } catch (error) {
    console.error('Error in admin username verification:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error during username verification'
    });
  }
});

/**
 * GET /api/admin/session-status
 * Check admin session status
 * Requires authentication
 */
router.get('/session-status', async (req, res) => {
  try {
    const userRole = req.userRole;
    const userId = req.userId;
    const userEmail = req.userEmail;

    // Verify user is admin
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    return res.json({
      success: true,
      data: {
        userId: userId,
        email: userEmail,
        role: userRole,
        sessionValid: true,
        lastActivity: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking admin session status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/extend-session
 * Extend admin session
 * Requires authentication
 */
router.post('/extend-session', adminRateLimit, async (req, res) => {
  try {
    const { user } = req;

    // Verify user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Log session extension
    console.log(`Admin session extended: ${user.email}`, {
      userId: user.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Session extended successfully',
      data: {
        extendedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error extending admin session:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/activity
 * Log admin activity (for session management)
 * Requires authentication
 */
router.post('/activity', async (req, res) => {
  try {
    const { user } = req;
    const { action, details } = req.body;

    // Verify user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Log the activity (in production, you might want to store this in a dedicated log table)
    console.log(`Admin activity: ${user.email}`, {
      userId: user.id,
      action: action || 'general_activity',
      details: details || {},
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Activity logged'
    });

  } catch (error) {
    console.error('Error logging admin activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/audit-log
 * Get admin audit log (recent activities)
 * Requires authentication and admin role
 */
router.get('/audit-log', adminRateLimit, async (req, res) => {
  try {
    const { user } = req;

    // Verify user has admin privileges
    if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // In a production system, you'd query a dedicated audit log table
    // For now, return a mock response
    const mockAuditLog = [
      {
        id: 1,
        action: 'admin_login',
        user_email: user.email,
        ip_address: req.ip,
        timestamp: new Date().toISOString(),
        details: { success: true }
      },
      {
        id: 2,
        action: 'session_extended',
        user_email: user.email,
        ip_address: req.ip,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        details: { method: 'manual' }
      }
    ];

    return res.json({
      success: true,
      data: mockAuditLog
    });

  } catch (error) {
    console.error('Error fetching admin audit log:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering options
 * Requires authentication and admin role
 */
router.get('/users', async (req, res) => {
  try {
    const userRole = req.userRole;

    // Verify user has admin privileges
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { role, status, search, limit = 50, offset = 0, page } = req.query;

    // Support both limit/offset and page-based pagination
    const actualLimit = parseInt(limit);
    const actualOffset = page ? (parseInt(page) - 1) * actualLimit : parseInt(offset);

    let queryText = `
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.name, u.phone, u.role,
        u.is_active, u.email_verified, u.user_status, u.last_login_at,
        u.created_at, u.updated_at, u.profile_picture_url,
        s.rating_average, s.rating_count, s.bio, s.specialties,
        (SELECT COUNT(*) FROM bookings b WHERE b.stylist_id = u.id AND b.status = 'completed') as completed_appointments,
        (SELECT COUNT(*) FROM user_sessions us WHERE us.user_id = u.id) as login_count
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id
    `;

    const queryParams = [];
    const conditions = [];

    // Add filtering conditions
    if (role) {
      conditions.push(`u.role = $${queryParams.length + 1}`);
      queryParams.push(role);
    }

    if (status) {
      // Support both status formats: 'active'/'APPROVED', 'SUSPENDED', 'BLOCKED'
      if (status.toLowerCase() === 'active') {
        conditions.push(`u.is_active = $${queryParams.length + 1}`);
        queryParams.push(true);
      } else if (['APPROVED', 'SUSPENDED', 'BLOCKED', 'PENDING'].includes(status.toUpperCase())) {
        conditions.push(`u.user_status = $${queryParams.length + 1}`);
        queryParams.push(status.toUpperCase());
      }
    }

    if (search) {
      conditions.push(`(
        LOWER(u.name) LIKE $${queryParams.length + 1} OR
        LOWER(u.email) LIKE $${queryParams.length + 1} OR
        LOWER(u.first_name) LIKE $${queryParams.length + 1} OR
        LOWER(u.last_name) LIKE $${queryParams.length + 1}
      )`);
      queryParams.push(`%${search.toLowerCase()}%`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(actualLimit, actualOffset);

    const result = await query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM users u';
    const countParams = [];

    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
      countParams.push(...queryParams.slice(0, queryParams.length - 2));
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Transform users data to match frontend interface (camelCase)
    const users = result.rows.map(userRow => ({
      id: userRow.id,
      email: userRow.email,
      firstName: userRow.first_name || null,
      lastName: userRow.last_name || null,
      name: userRow.name,
      phone: userRow.phone,
      role: userRow.role,
      status: userRow.user_status || 'APPROVED',
      isActive: userRow.is_active,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
      lastLoginAt: userRow.last_login_at,
      profilePictureUrl: userRow.profile_picture_url,
      rating: userRow.rating_average ? parseFloat(userRow.rating_average) : undefined,
      completedAppointments: userRow.completed_appointments ? parseInt(userRow.completed_appointments) : 0,
      loginCount: userRow.login_count ? parseInt(userRow.login_count) : 0,
      specialties: userRow.specialties ? userRow.specialties : undefined
    }));

    // Return response structure that frontend expects
    return res.json({
      users,
      totalPages: Math.ceil(totalCount / actualLimit),
      totalCount,
      currentPage: Math.floor(actualOffset / actualLimit) + 1
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/users
 * Create a new user
 * Requires authentication and admin role
 */
router.post('/users', async (req, res) => {
  try {
    const { user } = req;
    const { email, name, password, role, phone } = req.body;

    // Verify user has admin privileges
    if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Role hierarchy: ADMIN cannot create SUPERADMIN users
    if (user.role === 'ADMIN' && role === 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to create SUPERADMIN users'
      });
    }

    // Validate required fields
    if (!email || !name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, password, and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate role
    const validRoles = ['CLIENT', 'STYLIST', 'ADMIN'];
    if (user.role === 'SUPERADMIN') {
      validRoles.push('SUPERADMIN');
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(`
      INSERT INTO users (email, name, password_hash, role, phone, is_active, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
      RETURNING id, email, name, role, created_at
    `, [email, name, hashedPassword, role, phone]);

    const newUser = result.rows[0];

    // Log the action
    console.log(`User created by admin: ${user.email}`, {
      adminUserId: user.id,
      newUserId: newUser.id,
      newUserEmail: newUser.email,
      newUserRole: newUser.role,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.created_at
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a user
 * Requires authentication and admin role
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { user } = req;
    const userId = req.params.id;
    const { name, email, role, phone, is_active } = req.body;

    // Verify user has admin privileges
    if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get the target user
    const targetUserResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const targetUser = targetUserResult.rows[0];

    // Role hierarchy restrictions
    if (user.role === 'ADMIN') {
      // ADMIN cannot modify SUPERADMIN users
      if (targetUser.role === 'SUPERADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify SUPERADMIN users'
        });
      }

      // ADMIN cannot promote users to SUPERADMIN
      if (role === 'SUPERADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Cannot promote users to SUPERADMIN role'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    let paramCounter = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCounter}`);
      updateParams.push(name);
      paramCounter++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCounter}`);
      updateParams.push(email);
      paramCounter++;
    }

    if (role !== undefined) {
      const validRoles = ['CLIENT', 'STYLIST', 'ADMIN'];
      if (user.role === 'SUPERADMIN') {
        validRoles.push('SUPERADMIN');
      }

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      updateFields.push(`role = $${paramCounter}`);
      updateParams.push(role);
      paramCounter++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCounter}`);
      updateParams.push(phone);
      paramCounter++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCounter}`);
      updateParams.push(is_active);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, email, name, role, is_active, updated_at
    `;

    const result = await query(updateQuery, updateParams);
    const updatedUser = result.rows[0];

    // Log the action
    console.log(`User updated by admin: ${user.email}`, {
      adminUserId: user.id,
      targetUserId: userId,
      changes: req.body,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.is_active ? 'ACTIVE' : 'INACTIVE',
        updatedAt: updatedUser.updated_at
      },
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (only SUPERADMIN can delete ADMIN users)
 * Requires authentication and admin role
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { user } = req;
    const userId = req.params.id;

    // Verify user has admin privileges
    if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get the target user
    const targetUserResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const targetUser = targetUserResult.rows[0];

    // Role hierarchy restrictions
    if (user.role === 'ADMIN') {
      // ADMIN cannot delete ADMIN or SUPERADMIN users
      if (['ADMIN', 'SUPERADMIN'].includes(targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete admin users'
        });
      }
    }

    // Prevent self-deletion
    if (targetUser.id === user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user (CASCADE will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Log the action
    console.log(`User deleted by admin: ${user.email}`, {
      adminUserId: user.id,
      deletedUserId: userId,
      deletedUserEmail: targetUser.email,
      deletedUserRole: targetUser.role,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (APPROVED/SUSPENDED/BLOCKED)
 * Only ADMIN and SUPERADMIN can modify status
 */
router.put('/users/:id/status', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { user } = req;
    const userId = req.params.id;
    const { status } = req.body;

    if (!['APPROVED', 'SUSPENDED', 'BLOCKED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED, SUSPENDED, or BLOCKED'
      });
    }

    // Get the target user
    const targetUserResult = await query(
      'SELECT id, email, role, user_status FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const targetUser = targetUserResult.rows[0];

    // Role hierarchy check
    if (!canModifyUser(user.role, targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify users of equal or higher privilege level'
      });
    }

    // Special logic for stylists with pending payouts
    if (targetUser.role === 'STYLIST' && status === 'BLOCKED') {
      const hasPending = await hasPendingPayouts(userId);
      if (hasPending) {
        return res.status(400).json({
          success: false,
          message: 'Cannot block stylist with pending payouts. Use SUSPENDED status instead.'
        });
      }
    }

    // Update user status
    const result = await query(
      'UPDATE users SET user_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, user_status, updated_at',
      [status, userId]
    );

    const updatedUser = result.rows[0];

    // Log the action
    console.log(`User status updated by admin: ${user.email}`, {
      adminUserId: user.id,
      targetUserId: userId,
      oldStatus: targetUser.user_status,
      newStatus: status,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.user_status,
        updatedAt: updatedUser.updated_at
      },
      message: 'User status updated successfully'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/payouts
 * Create payout request for stylist (admin use)
 */
router.post('/payouts', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { user } = req;
    const { stylist_id, user_id, amount, payout_method, bank_details, notes } = req.body;

    // Validate required fields
    if (!stylist_id || !user_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID, User ID, and amount are required'
      });
    }

    // Verify the stylist exists and belongs to the user
    const stylistResult = await query(
      'SELECT s.id, u.email, u.role FROM stylists s JOIN users u ON s.user_id = u.id WHERE s.id = $1 AND s.user_id = $2',
      [stylist_id, user_id]
    );

    if (stylistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found or does not belong to specified user'
      });
    }

    // Create payout request
    const result = await query(`
      INSERT INTO payout_requests (stylist_id, user_id, amount, payout_method, bank_details, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, amount, status, requested_at
    `, [stylist_id, user_id, amount, payout_method || 'BANK_TRANSFER', bank_details, notes]);

    const newPayout = result.rows[0];

    // Log the action
    console.log(`Payout request created by admin: ${user.email}`, {
      adminUserId: user.id,
      payoutId: newPayout.id,
      stylistId: stylist_id,
      amount: amount,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      data: newPayout,
      message: 'Payout request created successfully'
    });

  } catch (error) {
    console.error('Error creating payout request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/payouts
 * Get all payout requests (admin only)
 */
router.get('/payouts', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT pr.*, u.email, u.name, s.business_name
      FROM payout_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN stylists s ON pr.stylist_id = s.id
    `;

    const queryParams = [];

    if (status) {
      queryText += ' WHERE pr.status = $1';
      queryParams.push(status);
    }

    queryText += ` ORDER BY pr.requested_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    return res.json({
      success: true,
      data: {
        payouts: result.rows,
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/admin/payouts/:id/status
 * Update payout request status
 */
router.put('/payouts/:id/status', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { user } = req;
    const payoutId = req.params.id;
    const { status, admin_notes } = req.body;

    if (!['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateFields = ['status = $1', 'admin_notes = $2', 'updated_at = NOW()'];
    const updateParams = [status, admin_notes];

    if (status === 'PROCESSING') {
      updateFields.push('processed_at = NOW()');
    } else if (status === 'COMPLETED') {
      updateFields.push('completed_at = NOW()');
    }

    const result = await query(`
      UPDATE payout_requests
      SET ${updateFields.join(', ')}
      WHERE id = $3
      RETURNING id, status, updated_at
    `, [...updateParams, payoutId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payout request not found'
      });
    }

    // Log the action
    console.log(`Payout status updated by admin: ${user.email}`, {
      adminUserId: user.id,
      payoutId: payoutId,
      newStatus: status,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Payout status updated successfully'
    });

  } catch (error) {
    console.error('Error updating payout status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/system-activity
 * Get recent system activity for dashboard
 */
/**
 * GET /api/admin/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get('/dashboard/stats', requireRole(['SUPERADMIN', 'ADMIN']), async (req, res) => {
  try {
    // Get user counts
    const userStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'CLIENT') as total_clients,
        COUNT(*) FILTER (WHERE role = 'STYLIST') as total_stylists,
        COUNT(*) FILTER (WHERE role IN ('ADMIN', 'SUPERADMIN')) as total_admins,
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month
      FROM users
    `);

    // Get booking stats
    const bookingStats = await query(`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE) as upcoming_bookings,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as bookings_this_week
      FROM bookings
    `);

    // Get payment/revenue stats
    const revenueStats = await query(`
      SELECT
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) as revenue_this_month,
        COALESCE(SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0) as revenue_this_week,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments
      FROM payments
    `);

    // Get payout stats
    const payoutStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_payouts,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_payouts,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_payouts,
        COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) as pending_payout_amount
      FROM payout_requests
    `);

    // Get dispute stats
    const disputeStats = await query(`
      SELECT
        COUNT(*) as total_disputes,
        COUNT(*) FILTER (WHERE status = 'OPEN') as open_disputes,
        COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as under_review_disputes,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_disputes
      FROM disputes
    `);

    // Get review stats
    const reviewStats = await query(`
      SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 1) as average_rating
      FROM reviews
    `);

    res.json({
      success: true,
      data: {
        users: userStats.rows[0],
        bookings: bookingStats.rows[0],
        revenue: revenueStats.rows[0],
        payouts: payoutStats.rows[0],
        disputes: disputeStats.rows[0],
        reviews: reviewStats.rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

router.get('/system-activity', requireRole(['SUPERADMIN', 'ADMIN']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent registrations
    const registrations = await query(`
      SELECT
        'registration' as type,
        CASE
          WHEN role = 'STYLIST' THEN 'New stylist registered: ' || name || COALESCE(' in ' || (SELECT location_city FROM stylists WHERE user_id = users.id LIMIT 1), '')
          WHEN role = 'CLIENT' THEN 'New client registered: ' || name
          ELSE 'New user registered: ' || name
        END as message,
        created_at,
        'success' as severity
      FROM users
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 3
    `);

    // Get recent bookings
    const bookings = await query(`
      SELECT
        'booking' as type,
        'Booking completed: ' || s.name || ' with ' || u.name as message,
        b.created_at,
        'info' as severity
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.client_id = u.id
      WHERE b.created_at >= NOW() - INTERVAL '24 hours'
      AND b.status = 'confirmed'
      ORDER BY b.created_at DESC
      LIMIT 3
    `);

    // Get recent payments
    const payments = await query(`
      SELECT
        'payment' as type,
        'Payment processed: $' || CAST(amount AS INTEGER) || ' for ' ||
          (SELECT name FROM services WHERE id = (SELECT service_id FROM bookings WHERE id = booking_id LIMIT 1)) as message,
        created_at,
        'success' as severity
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 2
    `);

    // Combine all activities
    const allActivities = [
      ...registrations.rows,
      ...bookings.rows,
      ...payments.rows
    ];

    // Sort by timestamp and limit
    allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const limitedActivities = allActivities.slice(0, parseInt(limit));

    // Format timestamp
    const formatTimestamp = (date) => {
      const now = new Date();
      const diff = Math.floor((now - new Date(date)) / 1000 / 60); // minutes

      if (diff < 1) return 'Just now';
      if (diff < 60) return `${diff} minutes`;
      if (diff < 1440) return `${Math.floor(diff / 60)} hours`;
      return `${Math.floor(diff / 1440)} days`;
    };

    const formattedActivities = limitedActivities.map((activity, index) => ({
      id: String(index + 1),
      type: activity.type,
      message: activity.message || 'Activity recorded',
      timestamp: formatTimestamp(activity.created_at),
      severity: activity.severity
    }));

    res.json({
      success: true,
      data: formattedActivities
    });

  } catch (error) {
    console.error('Error fetching system activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system activity'
    });
  }
});

/**
 * GET /api/admin/system/health
 * Get system health status
 */
router.get('/system/health', requireRole(['SUPERADMIN']), async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const axios = require('axios');

    const healthChecks = {
      postgres: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' },
      nginx: { status: 'unknown', message: '' },
      backend: { status: 'healthy', message: 'Running' },
      btcpay: { status: 'unknown', message: '' }
    };

    // Check PostgreSQL
    try {
      const startTime = Date.now();
      await query('SELECT 1');
      const responseTime = Date.now() - startTime;
      healthChecks.postgres = { status: 'healthy', message: 'Connected', responseTime };
    } catch (error) {
      healthChecks.postgres = { status: 'unhealthy', message: error.message };
    }

    // Check Redis
    try {
      const startTime = Date.now();
      const { stdout } = await execPromise('redis-cli ping');
      const responseTime = Date.now() - startTime;
      healthChecks.redis = { status: stdout.trim() === 'PONG' ? 'healthy' : 'unhealthy', message: stdout.trim(), responseTime };
    } catch (error) {
      healthChecks.redis = { status: 'unhealthy', message: 'Not responding' };
    }

    // Check Nginx
    try {
      const { stdout } = await execPromise('systemctl is-active nginx');
      healthChecks.nginx = { status: stdout.trim() === 'active' ? 'healthy' : 'unhealthy', message: stdout.trim() };
    } catch (error) {
      healthChecks.nginx = { status: 'unhealthy', message: 'Not running' };
    }

    // Check BTCPay Server
    try {
      const btcpayResponse = await axios.get('http://localhost:23080/btcpay/api/v1/health', { timeout: 3000 });
      if (btcpayResponse.data && btcpayResponse.data.synchronized !== undefined) {
        healthChecks.btcpay = {
          status: btcpayResponse.data.synchronized ? 'healthy' : 'syncing',
          message: btcpayResponse.data.synchronized ? 'Synchronized' : 'Syncing blockchain'
        };
      } else {
        healthChecks.btcpay = { status: 'healthy', message: 'Responding' };
      }
    } catch (error) {
      // Fallback to docker check
      try {
        const { stdout } = await execPromise('docker ps --filter "name=btcpay_server" --format "{{.Status}}"');
        if (stdout.includes('Up')) {
          healthChecks.btcpay = { status: 'healthy', message: 'Container running' };
        } else {
          healthChecks.btcpay = { status: 'unhealthy', message: 'Container not running' };
        }
      } catch (dockerError) {
        healthChecks.btcpay = { status: 'unhealthy', message: 'Not responding' };
      }
    }

    // Return health checks directly (not wrapped in data object)
    res.json(healthChecks);

  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking system health'
    });
  }
});

/**
 * GET /api/admin/system/monitoring-stack
 * Get monitoring stack status (Prometheus, Grafana, Loki, AlertManager)
 */
router.get('/system/monitoring-stack', requireRole(['SUPERADMIN']), async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const axios = require('axios');

    const monitoringStack = {
      prometheus: { status: 'unknown', message: '', url: 'https://beautycita.com/prometheus/' },
      grafana: { status: 'unknown', message: '', url: 'https://beautycita.com/debug/' },
      alertmanager: { status: 'unknown', message: '', url: 'https://beautycita.com/alerts/' },
      loki: { status: 'unknown', message: '' },
      nodeExporter: { status: 'unknown', message: '' }
    };

    // Check Prometheus
    try {
      // Check Prometheus API directly
      const prometheusResponse = await axios.get('http://localhost:9090/prometheus/-/healthy', { timeout: 3000 });
      if (prometheusResponse.status === 200) {
        monitoringStack.prometheus = {
          status: 'healthy',
          message: 'API responding',
          url: 'https://beautycita.com/prometheus/'
        };
      } else {
        monitoringStack.prometheus = {
          status: 'unhealthy',
          message: 'API not healthy',
          url: 'https://beautycita.com/prometheus/'
        };
      }
    } catch (error) {
      // Fallback to docker check
      try {
        const { stdout } = await execPromise('docker ps --filter "name=beautycita-prometheus" --format "{{.Status}}"');
        if (stdout && stdout.includes('Up')) {
          monitoringStack.prometheus = {
            status: 'healthy',
            message: 'Container running',
            url: 'https://beautycita.com/prometheus/'
          };
        } else {
          monitoringStack.prometheus = { status: 'not_installed', message: 'Service not found', url: 'https://beautycita.com/prometheus/' };
        }
      } catch (dockerError) {
        monitoringStack.prometheus = { status: 'not_installed', message: 'Service not found', url: 'https://beautycita.com/prometheus/' };
      }
    }

    // Check Grafana
    try {
      const grafanaResponse = await axios.get('http://localhost:3000/api/health', { timeout: 3000 });
      monitoringStack.grafana = {
        status: grafanaResponse.status === 200 ? 'healthy' : 'unhealthy',
        message: 'API responding',
        url: 'https://beautycita.com/debug/'
      };
    } catch (error) {
      monitoringStack.grafana = { status: 'unhealthy', message: 'Not responding', url: 'https://beautycita.com/debug/' };
    }

    // Check AlertManager
    try {
      const alertResponse = await axios.get('http://localhost:9093/-/healthy', { timeout: 3000 });
      monitoringStack.alertmanager = {
        status: alertResponse.status === 200 ? 'healthy' : 'unhealthy',
        message: 'API responding',
        url: 'https://beautycita.com/alerts/'
      };
    } catch (error) {
      monitoringStack.alertmanager = { status: 'unhealthy', message: 'Not responding', url: 'https://beautycita.com/alerts/' };
    }

    // Check Loki (if installed)
    try {
      const lokiResponse = await axios.get('http://localhost:3100/ready', { timeout: 3000 });
      monitoringStack.loki = {
        status: lokiResponse.status === 200 ? 'healthy' : 'unhealthy',
        message: 'API responding'
      };
    } catch (error) {
      monitoringStack.loki = { status: 'not_installed', message: 'Service not found' };
    }

    // Check Node Exporter
    try {
      const nodeResponse = await axios.get('http://localhost:9100/metrics', { timeout: 3000 });
      monitoringStack.nodeExporter = {
        status: nodeResponse.status === 200 ? 'healthy' : 'unhealthy',
        message: 'Exporting metrics'
      };
    } catch (error) {
      monitoringStack.nodeExporter = { status: 'unhealthy', message: 'Not responding' };
    }

    res.json(monitoringStack);

  } catch (error) {
    console.error('Error checking monitoring stack:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking monitoring stack'
    });
  }
});

/**
 * GET /api/admin/system/credits
 * Get service credits (Twilio, Anthropic, OpenAI)
 */
router.get('/system/credits', requireRole(['SUPERADMIN']), async (req, res) => {
  try {
    const axios = require('axios');

    const credits = {
      twilio: { balance: 'unknown', status: 'unknown', currency: 'USD' },
      anthropic: { balance: 'unknown', status: 'unknown', info: 'Check console.anthropic.com' },
      openai: { balance: 'unknown', status: 'unknown', info: 'Check platform.openai.com' }
    };

    // Check Twilio Balance
    try {
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

      if (twilioAccountSid && twilioAuthToken) {
        const twilioResponse = await axios.get(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Balance.json`,
          {
            auth: {
              username: twilioAccountSid,
              password: twilioAuthToken
            },
            timeout: 5000
          }
        );

        const balanceAmount = parseFloat(twilioResponse.data.balance);
        credits.twilio = {
          balance: 'Active & Working',
          status: 'connected',
          info: 'SMS & Video Calls',
          apiKeyValid: true,
          usedBy: 'SMS Notifications & Video Calls',
          actualBalance: balanceAmount,
          currency: twilioResponse.data.currency
        };
      } else {
        credits.twilio = { balance: 'N/A', status: 'not_configured', currency: 'USD' };
      }
    } catch (error) {
      console.error('Error fetching Twilio balance:', error.message);
      credits.twilio = { balance: 'error', status: 'error', currency: 'USD', error: error.message };
    }

    // Check Anthropic API status
    try {
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

      if (anthropicApiKey) {
        // Verify API key is valid by checking usage endpoint
        const anthropicResponse = await axios.get(
          'https://api.anthropic.com/v1/messages/count',
          {
            headers: {
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01'
            },
            timeout: 5000
          }
        ).catch(async () => {
          // If count endpoint doesn't work, try a minimal completion to verify key
          return await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'hi' }]
            },
            {
              headers: {
                'x-api-key': anthropicApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
              },
              timeout: 5000
            }
          );
        });

        credits.anthropic = {
          balance: 'Active & Working',
          status: 'connected',
          info: 'Issue tracker & Claude Agent running',
          apiKeyValid: true,
          usedBy: 'Issue Auto-Maintenance'
        };
      } else {
        credits.anthropic = { balance: 'N/A', status: 'not_configured' };
      }
    } catch (error) {
      console.error('Error checking Anthropic API:', error.message);
      credits.anthropic = {
        balance: 'error',
        status: 'error',
        error: error.response?.data?.error?.message || error.message,
        info: 'Check console.anthropic.com'
      };
    }

    // Check OpenAI API status
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (openaiApiKey) {
        // Check API key validity by listing models
        const openaiResponse = await axios.get(
          'https://api.openai.com/v1/models',
          {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`
            },
            timeout: 5000
          }
        );

        credits.openai = {
          balance: 'Active & Working',
          status: 'connected',
          info: 'Aphrodite AI assistant running',
          apiKeyValid: true,
          modelsAvailable: openaiResponse.data.data?.length || 0,
          usedBy: 'Aphrodite Assistant'
        };
      } else {
        credits.openai = { balance: 'N/A', status: 'not_configured' };
      }
    } catch (error) {
      console.error('Error checking OpenAI API:', error.message);
      credits.openai = {
        balance: 'error',
        status: 'error',
        error: error.response?.data?.error?.message || error.message,
        info: 'Check platform.openai.com'
      };
    }

    res.json(credits);

  } catch (error) {
    console.error('Error checking service credits:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking service credits'
    });
  }
});

/**
 * POST /api/admin/system/service/:service/action
 * Control system services (restart, stop, start)
 */
router.post('/system/service/:service/:action', requireRole(['SUPERADMIN']), async (req, res) => {
  try {
    const { service, action } = req.params;
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const allowedServices = ['nginx', 'btcpay', 'backend'];
    const allowedActions = ['start', 'stop', 'restart'];

    if (!allowedServices.includes(service)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service'
      });
    }

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    let command = '';
    let result = '';

    switch (service) {
      case 'nginx':
        command = `systemctl ${action} nginx`;
        break;
      case 'btcpay':
        if (action === 'restart') {
          command = 'docker restart $(docker ps -qf "name=btcpay")';
        } else if (action === 'stop') {
          command = 'docker stop $(docker ps -qf "name=btcpay")';
        } else if (action === 'start') {
          command = 'docker start $(docker ps -aqf "name=btcpay")';
        }
        break;
      case 'backend':
        command = `pm2 ${action} beautycita-backend`;
        break;
    }

    const { stdout, stderr } = await execPromise(command);
    result = stdout || stderr;

    res.json({
      success: true,
      message: `${service} ${action} executed successfully`,
      output: result
    });

  } catch (error) {
    console.error(`Error controlling service:`, error);
    res.status(500).json({
      success: false,
      message: `Error executing ${req.params.action} on ${req.params.service}`,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/btcpay/stats
 * Get BTCPay statistics for admin dashboard
 */
router.get('/btcpay/stats', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const stats = await btcpayService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching BTCPay stats:', error);
    res.status(500).json({
      error: 'Failed to fetch BTCPay statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/btcpay/store
 * Get BTCPay store information
 */
router.get('/btcpay/store', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const storeInfo = await btcpayService.getStoreInfo();
    res.json(storeInfo);
  } catch (error) {
    console.error('Error fetching BTCPay store info:', error);
    res.status(500).json({
      error: 'Failed to fetch BTCPay store information',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings
 * Get all bookings with filtering
 */
router.get('/bookings', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { status, date, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT
        b.id, b.status, b.booking_date, b.booking_time, b.duration_minutes, b.total_price, b.notes, b.created_at,
        uc.name as client_name, uc.phone as client_phone, uc.email as client_email,
        st.business_name as stylist_name,
        srv.name as service_name
      FROM bookings b
      LEFT JOIN users uc ON b.client_id = uc.id
      LEFT JOIN stylists st ON b.stylist_id = st.id
      LEFT JOIN services srv ON b.service_id = srv.id
    `;

    const queryParams = [];
    const conditions = [];

    if (status) {
      conditions.push(`b.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (date) {
      conditions.push(`DATE(b.scheduled_at) = $${queryParams.length + 1}`);
      queryParams.push(date);
    }

    if (search) {
      conditions.push(`(LOWER(uc.name) LIKE $${queryParams.length + 1} OR LOWER(us.name) LIKE $${queryParams.length + 1} OR LOWER(srv.name) LIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search.toLowerCase()}%`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY b.scheduled_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    const bookings = result.rows.map(row => ({
      id: row.id,
      client_name: row.client_name,
      client_phone: row.client_phone,
      client_email: row.client_email,
      stylist_name: row.stylist_name,
      service: row.service_name,
      date: row.scheduled_at ? row.scheduled_at.toISOString().split('T')[0] : null,
      time: row.scheduled_at ? row.scheduled_at.toISOString().split('T')[1].substring(0, 5) : null,
      duration: row.duration,
      price: parseFloat(row.total_price || 0),
      status: row.status,
      location: row.stylist_business,
      notes: row.notes,
      created_at: row.created_at
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM bookings b';
    const countParams = [];
    if (conditions.length > 0) {
      countQuery += ` LEFT JOIN users uc ON b.client_id = uc.id LEFT JOIN stylists st ON b.stylist_id = st.id LEFT JOIN services srv ON b.service_id = srv.id WHERE ${conditions.join(' AND ')}`;
      countParams.push(...queryParams.slice(0, queryParams.length - 2));
    }
    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return res.json({
      success: true,
      data: {
        bookings,
        totalCount,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/reviews
 * Get all reviews
 */
router.get('/reviews', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const result = await query(`
      SELECT
        r.id, r.rating, r.review_text, r.created_at, r.is_visible, r.is_approved,
        u.name as client_name,
        st.business_name as stylist_name
      FROM reviews r
      LEFT JOIN users u ON r.client_id = u.id
      LEFT JOIN stylists st ON r.stylist_id = st.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `);

    const reviews = result.rows.map(row => ({
      id: row.id,
      client_name: row.client_name,
      stylist_name: row.stylist_name,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      status: row.is_approved ? 'approved' : 'pending',
      visible: row.is_visible
    }));

    return res.json({ success: true, data: { reviews } });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/payouts
 * Get payout requests
 */
router.get('/payouts', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    return res.json({
      success: true,
      data: { payouts: [] }
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/refunds
 * Get refund requests
 */
router.get('/refunds', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    return res.json({
      success: true,
      data: { refunds: [] }
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/notifications
 * Get system notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    return res.json({
      success: true,
      data: { notifications: [] }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/disputes
 * Get payment disputes
 */
router.get('/disputes', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    return res.json({
      success: true,
      data: { disputes: [] }
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/marketing-content
 * Get marketing content
 */
router.get('/marketing-content', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    return res.json({
      success: true,
      data: { content: [] }
    });
  } catch (error) {
    console.error('Error fetching marketing content:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/wallet
 * Get wallet data
 */
router.get('/wallet', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN', 'STYLIST'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({
      success: true,
      data: { wallet: { balance: 0, transactions: [] } }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/payment-methods
 * Get payment methods
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const userRole = req.userRole;
    if (!['ADMIN', 'SUPERADMIN', 'STYLIST'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({
      success: true,
      data: { paymentMethods: [] }
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/users/create
 * Create a new user (admin can create any role except SUPERADMIN, superadmin can create all)
 */
router.post('/users/create', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    const currentUserRole = req.userRole;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    // Only SUPERADMIN can create SUPERADMIN accounts
    if (role === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Only superadmins can create superadmin accounts' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, name, password_hash, role, user_status) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [email, name, hashedPassword, role, 'APPROVED']
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (suspend/restore/block)
 */
router.put('/users/:id/status', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { user_status } = req.body;
    const currentUserRole = req.userRole;

    // Get target user
    const targetUser = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check role hierarchy
    if (!canModifyUser(currentUserRole, targetUser.rows[0].role)) {
      return res.status(403).json({ success: false, message: 'Cannot modify user of equal or higher role' });
    }

    await query('UPDATE users SET user_status = $1 WHERE id = $2', [user_status, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', requireRole(['SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/services
 * Get all services
 */
router.get('/services', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { limit = 100, offset = 0, search, category, page } = req.query;

    // Support both limit/offset and page-based pagination
    const actualLimit = parseInt(limit);
    const actualOffset = page ? (parseInt(page) - 1) * actualLimit : parseInt(offset);

    let queryText = `
      SELECT
        s.*,
        st.business_name as stylist_name,
        u.name as stylist_owner_name,
        COUNT(b.id) as total_bookings
      FROM services s
      LEFT JOIN stylists st ON s.stylist_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN bookings b ON s.id = b.service_id
    `;

    const queryParams = [];
    const conditions = [];

    if (search) {
      conditions.push(`(LOWER(s.name) LIKE $${queryParams.length + 1} OR LOWER(s.description) LIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search.toLowerCase()}%`);
    }

    if (category && category !== 'ALL') {
      conditions.push(`s.category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` GROUP BY s.id, st.id, st.business_name, u.name`;
    queryText += ` ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(actualLimit, actualOffset);

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM services s';
    const countParams = [];
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
      countParams.push(...queryParams.slice(0, queryParams.length - 2));
    }
    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Return response structure that frontend expects
    res.json({
      services: result.rows,
      totalPages: Math.ceil(totalCount / actualLimit),
      totalCount,
      currentPage: Math.floor(actualOffset / actualLimit) + 1
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/services
 * Create a new service
 */
router.post('/services', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { name, description, duration, base_price, category } = req.body;

    const result = await query(
      'INSERT INTO services (name, description, duration, base_price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, duration, base_price, category]
    );

    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/services/:id
 * Update a service
 */
router.put('/services/:id', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, base_price, category } = req.body;

    await query(
      'UPDATE services SET name = $1, description = $2, duration = $3, base_price = $4, category = $5 WHERE id = $6',
      [name, description, duration, base_price, category, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/services/:id
 * Delete a service
 */
router.delete('/services/:id', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/marketing/generate
 * Generate marketing content using AI
 */
router.post('/marketing/generate', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { type, prompt } = req.body;
    const axios = require('axios');

    const systemPrompts = {
      social: 'You are a social media expert for a beauty services platform. Create engaging, trendy posts.',
      email: 'You are an email marketing expert for a beauty platform. Create professional, conversion-focused emails.',
      blog: 'You are a beauty industry content writer. Create SEO-optimized, informative blog content.',
      ad: 'You are an advertising copywriter for a beauty platform. Create compelling ad copy.',
      sms: 'You are an SMS marketing expert. Create concise, action-driving messages under 160 characters.',
      promo: 'You are a promotional content writer for a beauty platform. Create exciting promotional text.'
    };

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompts[type] || systemPrompts.social },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ success: false, message: 'Failed to generate content' });
  }
});

/**
 * GET /api/admin/stylist-applications
 * Get all pending stylist applications
 */
router.get('/stylist-applications', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.created_at as registered_at,
        u.user_status,
        s.id as stylist_id,
        s.business_name,
        s.bio,
        s.specialties,
        s.experience_years,
        s.location_address,
        s.location_city,
        s.location_state,
        s.portfolio_images,
        s.stripe_account_id,
        s.stripe_onboarding_complete,
        s.rating_average,
        s.total_bookings
      FROM users u
      LEFT JOIN stylists s ON u.id = s.user_id
      WHERE u.user_status = 'PENDING_STYLIST_APPROVAL'
      ORDER BY u.updated_at DESC
    `);

    res.json({
      success: true,
      applications: result.rows
    });
  } catch (error) {
    console.error('Error fetching stylist applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

/**
 * POST /api/admin/stylist-applications/:userId/approve
 * Approve a stylist application
 */
router.post('/stylist-applications/:userId/approve', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    // Get user details
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user is pending approval
    if (user.user_status !== 'PENDING_STYLIST_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending stylist approval',
        currentStatus: user.user_status
      });
    }

    // Check if stylist profile exists
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Validate required fields
    const validationErrors = [];
    if (!stylist.location_address || stylist.location_address.trim() === '') {
      validationErrors.push('Business address is required');
    }
    if (!stylist.location_city || stylist.location_city.trim() === '') {
      validationErrors.push('Business city is required');
    }
    if (!stylist.business_name || stylist.business_name.trim() === '') {
      validationErrors.push('Business name is required');
    }
    if (!stylist.bio || stylist.bio.trim() === '') {
      validationErrors.push('Bio is required');
    }
    if (!stylist.specialties || stylist.specialties.length === 0) {
      validationErrors.push('At least one specialty is required');
    }
    if (!stylist.portfolio_images || stylist.portfolio_images.length === 0) {
      validationErrors.push('At least one portfolio image is required');
    }
    if (!stylist.stripe_onboarding_complete) {
      validationErrors.push('Stripe onboarding must be completed');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve: Profile incomplete',
        validationErrors
      });
    }

    // Update user role to STYLIST and status to APPROVED
    await query(`
      UPDATE users
      SET role = 'STYLIST', user_status = 'APPROVED', updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    console.log(`✅ Admin approved stylist application for user ${userId}`);

    // TODO: Send email notification to user about approval

    res.json({
      success: true,
      message: 'Stylist application approved successfully'
    });
  } catch (error) {
    console.error('Error approving stylist application:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application' });
  }
});

/**
 * POST /api/admin/stylist-applications/:userId/reject
 * Reject a stylist application
 */
router.post('/stylist-applications/:userId/reject', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Get user details
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user is pending approval
    if (user.user_status !== 'PENDING_STYLIST_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending stylist approval'
      });
    }

    // Update user status back to APPROVED (as CLIENT)
    await query(`
      UPDATE users
      SET user_status = 'APPROVED', updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    console.log(`❌ Admin rejected stylist application for user ${userId}: ${reason}`);

    // TODO: Send email notification to user about rejection with reason

    res.json({
      success: true,
      message: 'Stylist application rejected'
    });
  } catch (error) {
    console.error('Error rejecting stylist application:', error);
    res.status(500).json({ success: false, message: 'Failed to reject application' });
  }
});

// ============================================================================
// ADMIN DASHBOARD STATS ENDPOINTS (LIVE DATA - NO MOCK)
// ============================================================================

/**
 * GET /api/admin/dashboard
 * Get all dashboard stats in one call (optimized)
 */
router.get('/dashboard', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const [users, bookings, applications, disputes, messages, issues] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query("SELECT COUNT(*) as active FROM bookings WHERE status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"),
      query("SELECT COUNT(*) as pending FROM users WHERE user_status = 'PENDING_STYLIST_APPROVAL'"),
      query("SELECT COUNT(*) as active FROM disputes WHERE status IN ('OPEN', 'IN_REVIEW', 'AWAITING_RESPONSE')"),
      query("SELECT COUNT(*) as unread FROM messages WHERE is_read = false"),
      query("SELECT COUNT(*) as open FROM issues WHERE status IN ('open', 'in_progress')")
    ]);

    res.json({
      users: parseInt(users.rows[0].total),
      bookings: parseInt(bookings.rows[0].active),
      applications: parseInt(applications.rows[0].pending),
      disputes: parseInt(disputes.rows[0].active),
      messages: parseInt(messages.rows[0].unread),
      issues: parseInt(issues.rows[0].open)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      users: 0,
      bookings: 0,
      applications: 0,
      disputes: 0,
      messages: 0,
      issues: 0
    });
  }
});

/**
 * GET /api/admin/stats/users
 * Get total user count
 */
router.get('/stats/users', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as total FROM users');
    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ total: 0 });
  }
});

/**
 * GET /api/admin/stats/bookings
 * Get active bookings count
 */
router.get('/stats/bookings', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const result = await query(
      "SELECT COUNT(*) as active FROM bookings WHERE status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"
    );
    res.json({ active: parseInt(result.rows[0].active) });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ active: 0 });
  }
});

/**
 * GET /api/admin/stats/applications
 * Get pending stylist applications count
 */
router.get('/stats/applications', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const result = await query(
      "SELECT COUNT(*) as pending FROM users WHERE user_status = 'PENDING_STYLIST_APPROVAL'"
    );
    res.json({ pending: parseInt(result.rows[0].pending) });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ pending: 0 });
  }
});

/**
 * GET /api/admin/stats/disputes
 * Get active disputes count
 */
router.get('/stats/disputes', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const result = await query(
      "SELECT COUNT(*) as active FROM disputes WHERE status IN ('OPEN', 'IN_REVIEW', 'AWAITING_RESPONSE')"
    );
    res.json({ active: parseInt(result.rows[0].active) });
  } catch (error) {
    console.error('Error fetching dispute stats:', error);
    res.status(500).json({ active: 0 });
  }
});

/**
 * GET /api/admin/stats/messages
 * Get unread messages count (admin messages)
 */
router.get('/stats/messages', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    // Count unread messages where admin is recipient
    const result = await query(
      "SELECT COUNT(*) as unread FROM messages WHERE is_read = false AND recipient_id IN (SELECT id FROM users WHERE role IN ('ADMIN', 'SUPERADMIN'))"
    );
    res.json({ unread: parseInt(result.rows[0].unread) });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({ unread: 0 });
  }
});

/**
 * GET /api/admin/stats/issues
 * Get open issues count
 */
router.get('/stats/issues', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const result = await query(
      "SELECT COUNT(*) as open FROM issues WHERE status IN ('open', 'in_progress')"
    );
    res.json({ open: parseInt(result.rows[0].open) });
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    res.status(500).json({ open: 0 });
  }
});

/**
 * GET /api/admin/services/status
 * Get live status of all services (SUPERADMIN only)
 */
router.get('/services/status', requireRole(['SUPERADMIN']), async (req, res) => {
  try {
    const services = [];
    const startTime = Date.now();

    // Check Database
    try {
      await query('SELECT 1');
      services.push({
        name: 'PostgreSQL Database',
        status: 'online',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: 'Connected'
      });
    } catch (err) {
      services.push({
        name: 'PostgreSQL Database',
        status: 'offline',
        lastCheck: new Date(),
        details: err.message
      });
    }

    // Check Redis
    try {
      const redis = require('../redis');
      if (redis && redis.ping) {
        const redisStart = Date.now();
        await redis.ping();
        services.push({
          name: 'Redis Cache',
          status: 'online',
          responseTime: Date.now() - redisStart,
          lastCheck: new Date(),
          details: 'Connected'
        });
      } else {
        services.push({
          name: 'Redis Cache',
          status: 'degraded',
          lastCheck: new Date(),
          details: 'Redis client not available'
        });
      }
    } catch (err) {
      services.push({
        name: 'Redis Cache',
        status: 'offline',
        lastCheck: new Date(),
        details: err.message
      });
    }

    // Check Backend API
    services.push({
      name: 'Backend API',
      status: 'online',
      responseTime: Date.now() - startTime,
      lastCheck: new Date(),
      details: 'Running'
    });

    // Check Nginx (check if we can resolve localhost)
    const http = require('http');
    try {
      const nginxStart = Date.now();
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:80', (res) => {
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      services.push({
        name: 'Nginx Web Server',
        status: 'online',
        responseTime: Date.now() - nginxStart,
        lastCheck: new Date(),
        details: 'Responding'
      });
    } catch (err) {
      services.push({
        name: 'Nginx Web Server',
        status: 'degraded',
        lastCheck: new Date(),
        details: 'Cannot connect to port 80'
      });
    }

    // Check BTCPay (if configured)
    try {
      const btcpayStart = Date.now();
      // Just check if the service responds
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:49392', (res) => {
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(3000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      services.push({
        name: 'BTCPay Server',
        status: 'online',
        responseTime: Date.now() - btcpayStart,
        lastCheck: new Date(),
        details: 'Connected'
      });
    } catch (err) {
      services.push({
        name: 'BTCPay Server',
        status: 'offline',
        lastCheck: new Date(),
        details: 'Not responding'
      });
    }

    res.json({ services });
  } catch (error) {
    console.error('Error fetching service status:', error);
    res.status(500).json({ services: [] });
  }
});

/**
 * GET /api/admin/analytics
 * Get comprehensive analytics data
 */
router.get('/analytics', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    // User analytics
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');
    const usersThisWeek = await query(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const usersThisMonth = await query(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    const usersByRole = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // Booking analytics
    const totalBookings = await query('SELECT COUNT(*) as count FROM bookings');
    const bookingsThisWeek = await query(`
      SELECT COUNT(*) as count FROM bookings
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const bookingsThisMonth = await query(`
      SELECT COUNT(*) as count FROM bookings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    const bookingsByStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
    `);

    // Revenue analytics
    const totalRevenue = await query(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM bookings
      WHERE status = 'COMPLETED'
    `);
    const revenueThisMonth = await query(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM bookings
      WHERE status = 'COMPLETED'
      AND created_at >= NOW() - INTERVAL '30 days'
    `);
    const revenueThisWeek = await query(`
      SELECT COALESCE(SUM(total_price), 0) as total
      FROM bookings
      WHERE status = 'COMPLETED'
      AND created_at >= NOW() - INTERVAL '7 days'
    `);

    // Review analytics
    const totalReviews = await query('SELECT COUNT(*) as count FROM reviews');
    const avgRating = await query('SELECT COALESCE(AVG(rating), 0) as avg FROM reviews');

    // Transform role counts into object
    const byRole = {};
    usersByRole.rows.forEach(row => {
      byRole[row.role] = parseInt(row.count);
    });

    // Transform status counts into object
    const byStatus = {};
    bookingsByStatus.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    // Return response structure that frontend expects
    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        newThisWeek: parseInt(usersThisWeek.rows[0].count),
        newThisMonth: parseInt(usersThisMonth.rows[0].count),
        byRole
      },
      bookings: {
        total: parseInt(totalBookings.rows[0].count),
        thisWeek: parseInt(bookingsThisWeek.rows[0].count),
        thisMonth: parseInt(bookingsThisMonth.rows[0].count),
        byStatus
      },
      revenue: {
        total: parseFloat(totalRevenue.rows[0].total),
        thisMonth: parseFloat(revenueThisMonth.rows[0].total),
        thisWeek: parseFloat(revenueThisWeek.rows[0].total)
      },
      reviews: {
        total: parseInt(totalReviews.rows[0].count),
        averageRating: parseFloat(avgRating.rows[0].avg)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/issues
 * Get all issues from the issues table
 */
router.get('/issues', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT
        i.*,
        u.name as reporter_name,
        u.email as reporter_email
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
    `;

    const queryParams = [];
    const conditions = [];

    if (status) {
      conditions.push(`i.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY i.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM issues i';
    const countParams = [];
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
      countParams.push(...queryParams.slice(0, queryParams.length - 2));
    }
    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        issues: result.rows,
        totalCount,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/system/stats
 * Get live system stats (CPU, Memory, Disk, Network) - ADMIN and SUPERADMIN
 */
router.get('/system/stats', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const os = require('os');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    // CPU Stats - get real-time CPU usage
    let cpuUsage = 0;
    try {
      const { stdout: cpuOutput } = await execPromise('top -bn1 | grep "Cpu(s)"');
      const cpuMatch = cpuOutput.match(/(\d+\.\d+)\s+id/);
      const cpuIdle = cpuMatch ? parseFloat(cpuMatch[1]) : 0;
      cpuUsage = 100 - cpuIdle;
    } catch (err) {
      console.error('Error getting CPU usage:', err);
      cpuUsage = 0;
    }

    // Memory Stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem) * 100;

    // Disk Stats - get real disk usage
    let diskPercentage = 0;
    try {
      const { stdout } = await execPromise("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'");
      diskPercentage = parseFloat(stdout.trim()) || 0;
    } catch (err) {
      console.error('Error getting disk usage:', err);
      diskPercentage = 0;
    }

    // Network Stats - Calculate bandwidth rates
    let networkStats = { rx: 0, tx: 0, rxRate: 0, txRate: 0, rxRateMbps: 0, txRateMbps: 0 };
    try {
      const { stdout: netOutput } = await execPromise('cat /proc/net/dev | grep -E "(eth0|ens|enp)" | head -1');
      const netParts = netOutput.trim().split(/\s+/);
      if (netParts.length >= 10) {
        const currentRx = parseInt(netParts[1]) || 0;  // Received bytes (total)
        const currentTx = parseInt(netParts[9]) || 0;  // Transmitted bytes (total)
        const currentTime = Date.now();

        // Calculate time elapsed in seconds
        const timeElapsed = (currentTime - previousNetworkStats.timestamp) / 1000;

        // Calculate bandwidth rates (bytes per second)
        let rxRate = 0;
        let txRate = 0;

        if (timeElapsed > 0 && previousNetworkStats.rx > 0) {
          rxRate = (currentRx - previousNetworkStats.rx) / timeElapsed;
          txRate = (currentTx - previousNetworkStats.tx) / timeElapsed;
        }

        // Update previous stats for next calculation
        previousNetworkStats = {
          rx: currentRx,
          tx: currentTx,
          timestamp: currentTime
        };

        networkStats = {
          rx: currentRx,           // Total received bytes
          tx: currentTx,           // Total transmitted bytes
          rxRate: rxRate,          // Current download rate (bytes/sec)
          txRate: txRate,          // Current upload rate (bytes/sec)
          rxRateMbps: (rxRate * 8) / 1000000,  // Convert to Mbps
          txRateMbps: (txRate * 8) / 1000000   // Convert to Mbps
        };
      }
    } catch (error) {
      console.error('Error getting network stats:', error);
    }

    // Return format matching frontend expectations
    res.json({
      cpu: Math.round(cpuUsage * 10) / 10,
      memory: Math.round(memPercentage * 10) / 10,
      disk: Math.round(diskPercentage * 10) / 10,
      network: networkStats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({
      cpu: 0,
      memory: 0,
      disk: 0,
      network: { rx: 0, tx: 0 }
    });
  }
});

// ============================================================================
// USERNAME CHANGE REQUEST MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/username-change-requests
 * Get all username change requests (for /panel/applications)
 */
router.get('/username-change-requests', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { status } = req.query;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE ucr.status = $1';
      params.push(status);
    }

    const result = await query(`
      SELECT
        ucr.id,
        ucr.user_id,
        ucr.current_username,
        ucr.requested_username,
        ucr.reason,
        ucr.status,
        ucr.reviewed_by,
        ucr.reviewed_at,
        ucr.review_notes,
        ucr.created_at,
        u.email,
        u.name,
        u.first_name,
        u.last_name,
        u.role,
        reviewer.email as reviewer_email,
        reviewer.name as reviewer_name
      FROM username_change_requests ucr
      JOIN users u ON ucr.user_id = u.id
      LEFT JOIN users reviewer ON ucr.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY ucr.created_at DESC
    `, params);

    res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Error fetching username change requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch username change requests' });
  }
});

/**
 * POST /api/admin/username-change-requests/:requestId/approve
 * Approve a username change request
 */
router.post('/username-change-requests/:requestId/approve', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    // Get the request details
    const requestResult = await query(
      'SELECT * FROM username_change_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed'
      });
    }

    // Check if requested username is still available
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [request.requested_username, request.user_id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'The requested username is no longer available'
      });
    }

    // Update user's username
    await query(
      'UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2',
      [request.requested_username, request.user_id]
    );

    // Mark request as approved
    await query(
      `UPDATE username_change_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3, updated_at = NOW()
       WHERE id = $4`,
      ['APPROVED', adminId, notes || null, requestId]
    );

    console.log(`✅ Admin ${adminId} approved username change request ${requestId}: ${request.current_username} → ${request.requested_username}`);

    res.json({
      success: true,
      message: 'Username change request approved'
    });
  } catch (error) {
    console.error('Error approving username change request:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
});

/**
 * POST /api/admin/username-change-requests/:requestId/reject
 * Reject a username change request
 */
router.post('/username-change-requests/:requestId/reject', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Get the request details
    const requestResult = await query(
      'SELECT * FROM username_change_requests WHERE id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed'
      });
    }

    // Mark request as rejected
    await query(
      `UPDATE username_change_requests
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_notes = $3, updated_at = NOW()
       WHERE id = $4`,
      ['REJECTED', adminId, reason, requestId]
    );

    console.log(`❌ Admin ${adminId} rejected username change request ${requestId}: ${reason}`);

    res.json({
      success: true,
      message: 'Username change request rejected'
    });
  } catch (error) {
    console.error('Error rejecting username change request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});

// ============================================================================
// USER STATUS MANAGEMENT
// ============================================================================

/**
 * PUT /api/admin/users/:userId/status
 * Update user account status (APPROVED, PENDING, SUSPENDED, TERMINATED)
 */
router.put('/users/:userId/status', requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['APPROVED', 'PENDING', 'SUSPENDED', 'BLOCKED', 'PENDING_ONBOARDING', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'PENDING_STYLIST_APPROVAL'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get current user info
    const userResult = await query(
      'SELECT id, email, role, user_status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = userResult.rows[0];

    // Update user status
    await query(
      'UPDATE users SET user_status = $1, updated_at = NOW() WHERE id = $2',
      [status, userId]
    );

    console.log(`Admin ${req.user.id} changed user ${userId} status from ${currentUser.user_status} to ${status}. Reason: ${reason || 'N/A'}`);

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      previousStatus: currentUser.user_status,
      newStatus: status
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

module.exports = router;