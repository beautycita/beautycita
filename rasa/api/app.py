"""
Flask API wrapper for RASA with security middleware
Provides authenticated endpoints for the BeautyCita chat widget
"""

import os
import logging
import requests
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from security import SecurityMiddleware, require_auth, generate_frontend_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
RASA_SERVER_URL = os.getenv('RASA_SERVER_URL', 'http://localhost:5005')
RASA_ACTION_SERVER_URL = os.getenv('RASA_ACTION_SERVER_URL', 'http://localhost:5055')

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)

    # Configure CORS for BeautyCita domain
    CORS(app, origins=[
        'https://beautycita.com',
        'http://localhost:3000',  # Development
        'http://localhost:5173'   # Vite dev server
    ])

    # Initialize security middleware
    security = SecurityMiddleware(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            # Check RASA server health
            rasa_response = requests.get(f"{RASA_SERVER_URL}/", timeout=5)
            rasa_healthy = rasa_response.status_code == 200

            return jsonify({
                'status': 'healthy' if rasa_healthy else 'degraded',
                'rasa_server': 'healthy' if rasa_healthy else 'unhealthy',
                'timestamp': int(os.time.time() if hasattr(os, 'time') else 0)
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500

    @app.route('/api/auth/token', methods=['POST'])
    def get_auth_token():
        """Generate authentication token for BeautyCita frontend"""
        try:
            data = request.get_json()

            # Validate request from BeautyCita backend
            if not data or 'client_secret' not in data:
                return jsonify({'error': 'Client secret required'}), 400

            # In production, validate against a secure client secret
            expected_secret = os.getenv('BEAUTYCITA_CLIENT_SECRET', 'beautycita_secret_2025')
            if data['client_secret'] != expected_secret:
                return jsonify({'error': 'Invalid client secret'}), 401

            # Generate token
            token = generate_frontend_token()

            return jsonify({
                'access_token': token,
                'token_type': 'Bearer',
                'expires_in': 86400  # 24 hours
            })

        except Exception as e:
            logger.error(f"Token generation failed: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/chat/webhook', methods=['POST'])
    @require_auth
    def chat_webhook():
        """Authenticated webhook endpoint for chat messages"""
        try:
            data = request.get_json()

            # Forward request to RASA
            rasa_response = requests.post(
                f"{RASA_SERVER_URL}/webhooks/rest/webhook",
                json=data,
                timeout=30
            )

            if rasa_response.status_code == 200:
                return jsonify(rasa_response.json())
            else:
                logger.error(f"RASA server error: {rasa_response.status_code}")
                return jsonify({
                    'error': 'Chat service temporarily unavailable'
                }), 503

        except requests.Timeout:
            logger.error("RASA server timeout")
            return jsonify({
                'error': 'Chat service timeout'
            }), 504
        except Exception as e:
            logger.error(f"Chat webhook error: {e}")
            return jsonify({
                'error': 'Internal server error'
            }), 500

    @app.route('/api/chat/conversations/<conversation_id>', methods=['GET'])
    @require_auth
    def get_conversation(conversation_id):
        """Get conversation history"""
        try:
            # In production, implement conversation retrieval from database
            return jsonify({
                'conversation_id': conversation_id,
                'messages': [],
                'status': 'active'
            })
        except Exception as e:
            logger.error(f"Get conversation error: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/admin/generate-token', methods=['POST'])
    def admin_generate_token():
        """Admin endpoint to generate API tokens"""
        try:
            data = request.get_json()

            # Validate admin credentials
            admin_secret = os.getenv('ADMIN_SECRET', 'admin_secret_2025')
            if not data or data.get('admin_secret') != admin_secret:
                return jsonify({'error': 'Invalid admin credentials'}), 401

            client_id = data.get('client_id', 'default_client')
            token = security.generate_api_key(client_id)

            return jsonify({
                'client_id': client_id,
                'access_token': token,
                'instructions': 'Use this token in Authorization header: Bearer <token>'
            })

        except Exception as e:
            logger.error(f"Admin token generation failed: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    return app

if __name__ == '__main__':
    app = create_app()

    # Development server
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'

    logger.info(f"Starting RASA API server on port {port}")
    logger.info(f"RASA server URL: {RASA_SERVER_URL}")

    app.run(host='0.0.0.0', port=port, debug=debug)