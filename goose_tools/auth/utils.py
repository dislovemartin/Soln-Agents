"""
Authentication utilities and helpers
"""

import os
from functools import wraps
from flask import request, jsonify, current_app, g
from flask_jwt_extended import (
    verify_jwt_in_request, create_access_token,
    create_refresh_token, get_jwt_identity
)

from goose_tools.auth.models import UserManager, create_default_admin


def get_user_manager():
    """Get or create the user manager instance"""
    if not hasattr(g, 'user_manager'):
        g.user_manager = UserManager()
        # Create default admin if needed
        create_default_admin(g.user_manager)
    return g.user_manager


def admin_required():
    """Decorator to require admin role"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # Verify JWT
            verify_jwt_in_request()
            
            # Get user
            username = get_jwt_identity()
            user_manager = get_user_manager()
            user = user_manager.get_user(username)
            
            # Check admin role
            if not user or not user.get("admin", False):
                return jsonify({"success": False, "error": "Admin privileges required"}), 403
                
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def generate_tokens(username):
    """Generate access and refresh tokens for a user"""
    access_token = create_access_token(identity=username)
    refresh_token = create_refresh_token(identity=username)
    return access_token, refresh_token


def init_auth(app):
    """Initialize authentication for the Flask app"""
    # Configure JWT
    app.config["JWT_SECRET_KEY"] = os.environ.get(
        "GOOSE_JWT_SECRET", 
        "dev-secret-key-change-in-production"
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 2592000  # 30 days
    
    # Initialize JWT
    from flask_jwt_extended import JWTManager
    jwt = JWTManager(app)
    
    # Initialize BCrypt
    from flask_bcrypt import Bcrypt
    bcrypt = Bcrypt(app)
    
    return jwt, bcrypt