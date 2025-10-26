/**
 * API Versioning Implementation
 * Supports multiple API versions simultaneously for backwards compatibility
 *
 * Versioning strategies:
 * 1. URI Versioning: /api/v1/*, /api/v2/*
 * 2. Header Versioning: Accept: application/vnd.beautycita.v1+json
 * 3. Query Parameter: /api/users?version=2
 */

const express = require('express');

// Version-specific routes will be mounted by the main app
// This module only provides versioning middleware and utilities

// ============================================
// Version Detection Middleware
// ============================================

function detectApiVersion(req, res, next) {
  let version = 'v1'; // Default version

  // Priority 1: URI-based versioning (preferred)
  const uriVersionMatch = req.path.match(/^\/api\/v(\d+)/);
  if (uriVersionMatch) {
    version = `v${uriVersionMatch[1]}`;
  }

  // Priority 2: Header-based versioning
  else if (req.headers['api-version']) {
    version = `v${req.headers['api-version']}`;
  }

  // Priority 3: Accept header versioning
  else if (req.headers.accept) {
    const acceptMatch = req.headers.accept.match(/application\/vnd\.beautycita\.v(\d+)/);
    if (acceptMatch) {
      version = `v${acceptMatch[1]}`;
    }
  }

  // Priority 4: Query parameter versioning
  else if (req.query.version) {
    version = `v${req.query.version}`;
  }

  req.apiVersion = version;
  res.setHeader('API-Version', version);

  next();
}

// ============================================
// Version Deprecation Middleware
// ============================================

const deprecatedVersions = {
  v1: {
    deprecated: false,
    sunsetDate: '2026-10-21', // 1 year from now
    message: 'API v1 will be deprecated on October 21, 2026. Please migrate to v2.'
  }
};

function checkDeprecation(req, res, next) {
  const versionInfo = deprecatedVersions[req.apiVersion];

  if (versionInfo && versionInfo.deprecated) {
    res.setHeader('Warning', `299 - "Deprecated API - ${versionInfo.message}"`);
    res.setHeader('Sunset', versionInfo.sunsetDate);
  }

  next();
}

// ============================================
// Version Router (Simplified)
// ============================================

// Note: Version-specific routes should be mounted by the main application
// This module provides the middleware and utilities for versioning

// ============================================
// Version Compatibility Layer
// ============================================

/**
 * Transform data between API versions
 * Allows maintaining backwards compatibility while evolving the API
 */
class VersionTransformer {
  /**
   * Transform v1 request to v2 format
   */
  static transformV1ToV2Request(v1Data) {
    return {
      ...v1Data,
      // v2 uses snake_case for consistency
      fullName: v1Data.full_name,
      profilePicture: v1Data.profile_picture_url,
      // v2 has enhanced user types
      userType: v1Data.role === 'STYLIST' ? 'stylist' : 'client'
    };
  }

  /**
   * Transform v2 response to v1 format
   */
  static transformV2ToV1Response(v2Data) {
    return {
      ...v2Data,
      // v1 uses camelCase
      full_name: v2Data.fullName,
      profile_picture_url: v2Data.profilePicture,
      // v1 uses simpler role system
      role: v2Data.userType === 'stylist' ? 'STYLIST' : 'CLIENT'
    };
  }

  /**
   * Transform booking data for different versions
   */
  static transformBooking(booking, toVersion) {
    if (toVersion === 'v1') {
      // v1 format
      return {
        id: booking.id,
        client_id: booking.clientId,
        stylist_id: booking.stylistId,
        booking_date: booking.date,
        booking_time: booking.time,
        status: booking.status,
        total_price: booking.totalPrice
      };
    } else {
      // v2 format (more detailed)
      return {
        id: booking.id,
        clientId: booking.client_id,
        stylistId: booking.stylist_id,
        date: booking.booking_date,
        time: booking.booking_time,
        status: booking.status,
        totalPrice: booking.total_price,
        duration: booking.duration_minutes,
        service: {
          id: booking.service_id,
          name: booking.service_name
        },
        // v2 includes event history
        events: booking.events || []
      };
    }
  }
}

// ============================================
// Version-specific Error Handlers
// ============================================

function createVersionedErrorHandler(version) {
  return (err, req, res, next) => {
    console.error(`Error in API ${version}:`, err);

    if (version === 'v1') {
      // v1 error format (simple)
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        code: err.code
      });
    } else {
      // v2 error format (detailed)
      res.status(err.status || 500).json({
        success: false,
        error: {
          message: err.message || 'Internal server error',
          code: err.code,
          details: err.details,
          timestamp: new Date().toISOString(),
          path: req.path,
          requestId: req.id
        }
      });
    }
  };
}

// ============================================
// Version Migration Guide Endpoint
// ============================================

function migrationGuideRouter() {
  const router = express.Router();

  router.get('/migration-guide', (req, res) => {
    res.json({
      title: 'BeautyCita API Migration Guide',
      currentVersion: 'v2',
      versions: {
        v1: {
          status: 'active',
          deprecated: false,
          sunsetDate: '2026-10-21',
          documentation: 'https://docs.beautycita.com/api/v1'
        },
        v2: {
          status: 'active',
          recommended: true,
          documentation: 'https://docs.beautycita.com/api/v2',
          releaseDate: '2025-10-21'
        }
      },
      breaking_changes: {
        v2: [
          {
            change: 'Response format standardized',
            description: 'All responses now wrapped in {success, data, error} format',
            migration: 'Update response parsing to access data from response.data'
          },
          {
            change: 'Field naming convention',
            description: 'Changed from snake_case to camelCase',
            migration: 'Update field names: full_name → fullName, profile_picture_url → profilePicture'
          },
          {
            change: 'Event sourcing for bookings',
            description: 'Bookings now include complete event history',
            migration: 'Access booking events via booking.events array'
          },
          {
            change: 'Enhanced authentication',
            description: 'JWT tokens now include more user context',
            migration: 'Update token parsing to handle new fields'
          }
        ]
      },
      new_features: {
        v2: [
          'GraphQL endpoint at /graphql',
          'Event sourcing for booking audit trail',
          'Real-time subscriptions via WebSocket',
          'Batch operations support',
          'Mobile BFF endpoints at /api/mobile/v1',
          'Enhanced error messages with request tracking'
        ]
      }
    });
  });

  return router;
}

module.exports = {
  detectApiVersion,
  checkDeprecation,
  VersionTransformer,
  createVersionedErrorHandler,
  migrationGuideRouter
};
