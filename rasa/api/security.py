"""
Security middleware for RASA API endpoints
Handles JWT authentication, rate limiting, and request validation
"""

import jwt
import time
import hashlib
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g
import redis
import os

logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'beautycita_rasa_secret_2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Redis configuration for rate limiting
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 1))

# Rate limiting configuration
RATE_LIMIT_REQUESTS = 100  # requests per window
RATE_LIMIT_WINDOW = 3600   # 1 hour in seconds
BURST_LIMIT = 10          # burst requests per minute

class SecurityMiddleware:
    def __init__(self, app: Flask = None):
        self.app = app
        self.redis_client = None

        if app:
            self.init_app(app)

    def init_app(self, app: Flask):
        """Initialize security middleware with Flask app"""
        self.app = app

        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established for rate limiting")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Rate limiting will use in-memory fallback.")
            self.redis_client = None

        # Register middleware
        app.before_request(self.before_request)
        app.after_request(self.after_request)

    def generate_api_key(self, client_id: str, expires_in_hours: int = JWT_EXPIRATION_HOURS) -> str:
        """Generate JWT token for API access"""
        payload = {
            'client_id': client_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
            'iss': 'beautycita-rasa',
            'aud': 'beautycita-api'
        }

        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def verify_api_key(self, token: str) -> Tuple[bool, Optional[Dict]]:
        """Verify JWT token and return payload if valid"""
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM],
                audience='beautycita-api'
            )
            return True, payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return False, {'error': 'Token expired'}
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return False, {'error': 'Invalid token'}

    def get_client_identifier(self) -> str:
        """Get unique client identifier for rate limiting"""
        # Try to get client ID from JWT
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            is_valid, payload = self.verify_api_key(token)
            if is_valid and payload:
                return f"client_{payload.get('client_id', 'unknown')}"

        # Fallback to IP address
        return f"ip_{request.remote_addr}"

    def check_rate_limit(self, client_id: str) -> Tuple[bool, Dict]:
        """Check if client is within rate limits"""
        current_time = int(time.time())

        if self.redis_client:
            return self._check_rate_limit_redis(client_id, current_time)
        else:
            return self._check_rate_limit_memory(client_id, current_time)

    def _check_rate_limit_redis(self, client_id: str, current_time: int) -> Tuple[bool, Dict]:
        """Redis-based rate limiting"""
        try:
            # Sliding window rate limiting
            window_start = current_time - RATE_LIMIT_WINDOW
            burst_window_start = current_time - 60  # 1 minute for burst

            # Clean old entries
            self.redis_client.zremrangebyscore(f"rate_limit:{client_id}", 0, window_start)
            self.redis_client.zremrangebyscore(f"burst_limit:{client_id}", 0, burst_window_start)

            # Count requests
            request_count = self.redis_client.zcard(f"rate_limit:{client_id}")
            burst_count = self.redis_client.zcard(f"burst_limit:{client_id}")

            # Check limits
            if request_count >= RATE_LIMIT_REQUESTS:
                return False, {
                    'error': 'Rate limit exceeded',
                    'limit': RATE_LIMIT_REQUESTS,
                    'window': RATE_LIMIT_WINDOW,
                    'reset_time': current_time + RATE_LIMIT_WINDOW
                }

            if burst_count >= BURST_LIMIT:
                return False, {
                    'error': 'Burst limit exceeded',
                    'limit': BURST_LIMIT,
                    'window': 60,
                    'reset_time': current_time + 60
                }

            # Record this request
            pipeline = self.redis_client.pipeline()
            pipeline.zadd(f"rate_limit:{client_id}", {str(current_time): current_time})
            pipeline.zadd(f"burst_limit:{client_id}", {str(current_time): current_time})
            pipeline.expire(f"rate_limit:{client_id}", RATE_LIMIT_WINDOW)
            pipeline.expire(f"burst_limit:{client_id}", 60)
            pipeline.execute()

            return True, {
                'requests_remaining': RATE_LIMIT_REQUESTS - request_count - 1,
                'reset_time': current_time + RATE_LIMIT_WINDOW
            }

        except Exception as e:
            logger.error(f"Redis rate limiting error: {e}")
            return True, {}  # Allow request on error

    def _check_rate_limit_memory(self, client_id: str, current_time: int) -> Tuple[bool, Dict]:
        """In-memory fallback rate limiting"""
        if not hasattr(g, 'rate_limit_storage'):
            g.rate_limit_storage = {}

        if client_id not in g.rate_limit_storage:
            g.rate_limit_storage[client_id] = []

        # Clean old entries
        g.rate_limit_storage[client_id] = [
            timestamp for timestamp in g.rate_limit_storage[client_id]
            if timestamp > current_time - RATE_LIMIT_WINDOW
        ]

        # Check limit
        if len(g.rate_limit_storage[client_id]) >= RATE_LIMIT_REQUESTS:
            return False, {
                'error': 'Rate limit exceeded',
                'limit': RATE_LIMIT_REQUESTS,
                'window': RATE_LIMIT_WINDOW
            }

        # Record request
        g.rate_limit_storage[client_id].append(current_time)

        return True, {
            'requests_remaining': RATE_LIMIT_REQUESTS - len(g.rate_limit_storage[client_id])
        }

    def validate_request(self) -> Tuple[bool, Optional[str]]:
        """Validate incoming request"""
        # Check content type for POST requests
        if request.method == 'POST':
            if not request.is_json:
                return False, "Content-Type must be application/json"

            try:
                data = request.get_json()
                if not data:
                    return False, "Request body is required"

                # Validate required fields for webhook
                if request.endpoint == 'webhook':
                    required_fields = ['sender', 'message']
                    for field in required_fields:
                        if field not in data:
                            return False, f"Missing required field: {field}"

                # Basic input validation
                if 'message' in data:
                    message = data['message']
                    if len(message) > 1000:
                        return False, "Message too long (max 1000 characters)"

                    # Check for potentially malicious content
                    dangerous_patterns = ['<script', 'javascript:', 'data:text/html']
                    if any(pattern in message.lower() for pattern in dangerous_patterns):
                        return False, "Invalid message content"

            except Exception as e:
                return False, f"Invalid JSON: {str(e)}"

        return True, None

    def before_request(self):
        """Process request before handling"""
        # Skip security for health check endpoints
        if request.endpoint in ['health', 'status']:
            return

        # Validate request format
        is_valid, error_msg = self.validate_request()
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Get client identifier
        client_id = self.get_client_identifier()
        g.client_id = client_id

        # Check rate limiting
        is_allowed, rate_info = self.check_rate_limit(client_id)
        if not is_allowed:
            response = jsonify(rate_info)
            response.status_code = 429
            response.headers['Retry-After'] = str(rate_info.get('reset_time', 60))
            return response

        # Store rate limit info for response headers
        g.rate_limit_info = rate_info

        # Authentication check for protected endpoints
        if request.endpoint in ['webhook', 'model', 'conversations']:
            auth_header = request.headers.get('Authorization')

            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Authorization token required'}), 401

            token = auth_header.split(' ')[1]
            is_valid, payload = self.verify_api_key(token)

            if not is_valid:
                return jsonify({'error': payload.get('error', 'Invalid token')}), 401

            # Store client info
            g.client_info = payload

    def after_request(self, response):
        """Process response after handling"""
        # Add rate limit headers
        if hasattr(g, 'rate_limit_info'):
            info = g.rate_limit_info
            if 'requests_remaining' in info:
                response.headers['X-RateLimit-Remaining'] = str(info['requests_remaining'])
            if 'reset_time' in info:
                response.headers['X-RateLimit-Reset'] = str(info['reset_time'])
            response.headers['X-RateLimit-Limit'] = str(RATE_LIMIT_REQUESTS)

        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        return response

def require_auth(f):
    """Decorator to require authentication for specific routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'client_info'):
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def create_api_key(client_id: str) -> str:
    """Utility function to create API keys for clients"""
    security = SecurityMiddleware()
    return security.generate_api_key(client_id)

# Example usage for BeautyCita frontend
def generate_frontend_token() -> str:
    """Generate token for BeautyCita frontend"""
    return create_api_key('beautycita_frontend')