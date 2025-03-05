"""
Authentication routes and views
"""

from flask import Blueprint, request, jsonify, render_template, redirect, url_for, g
from flask_jwt_extended import (
    jwt_required, jwt_refresh_token_required,
    get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)

from goose_tools.auth.utils import get_user_manager, generate_tokens, admin_required

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login and get JWT tokens"""
    # Get credentials
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400
    
    # Authenticate
    user_manager = get_user_manager()
    success, result = user_manager.authenticate(username, password)
    
    if not success:
        return jsonify({"success": False, "error": result}), 401
    
    # Generate tokens
    access_token, refresh_token = generate_tokens(username)
    
    # Return tokens
    return jsonify({
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "username": result["username"],
            "email": result.get("email"),
            "admin": result.get("admin", False)
        }
    })

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    # Get identity from refresh token
    username = get_jwt_identity()
    
    # Generate new access token
    access_token = create_access_token(identity=username)
    
    # Return new access token
    return jsonify({
        "success": True,
        "access_token": access_token
    })

@auth_bp.route('/register', methods=['POST'])
@admin_required()
def register():
    """Register a new user (admin only)"""
    # Get user data
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    admin = data.get('admin', False)
    
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400
    
    # Create user
    user_manager = get_user_manager()
    success, message = user_manager.create_user(username, password, email, admin)
    
    if not success:
        return jsonify({"success": False, "error": message}), 400
    
    return jsonify({
        "success": True,
        "message": message
    })

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get user information"""
    # Get user from token
    username = get_jwt_identity()
    user_manager = get_user_manager()
    user = user_manager.get_user(username)
    
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    # Remove password for security
    user_copy = user.copy()
    user_copy.pop("password", None)
    
    return jsonify({
        "success": True,
        "user": user_copy
    })

@auth_bp.route('/user', methods=['PUT'])
@jwt_required()
def update_user():
    """Update user information"""
    # Get user from token
    username = get_jwt_identity()
    
    # Get update data
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    # Update user
    user_manager = get_user_manager()
    success, message = user_manager.update_user(username, data)
    
    if not success:
        return jsonify({"success": False, "error": message}), 400
    
    return jsonify({
        "success": True,
        "message": message
    })

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    # Get user from token
    username = get_jwt_identity()
    
    # Get password data
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({"success": False, "error": "Old and new passwords are required"}), 400
    
    # Change password
    user_manager = get_user_manager()
    success, message = user_manager.change_password(username, old_password, new_password)
    
    if not success:
        return jsonify({"success": False, "error": message}), 400
    
    return jsonify({
        "success": True,
        "message": message
    })

@auth_bp.route('/users', methods=['GET'])
@admin_required()
def list_users():
    """List all users (admin only)"""
    user_manager = get_user_manager()
    users = user_manager.list_users()
    
    return jsonify({
        "success": True,
        "users": users
    })

@auth_bp.route('/users/<username>', methods=['DELETE'])
@admin_required()
def delete_user(username):
    """Delete a user (admin only)"""
    user_manager = get_user_manager()
    success, message = user_manager.delete_user(username)
    
    if not success:
        return jsonify({"success": False, "error": message}), 400
    
    return jsonify({
        "success": True,
        "message": message
    })

# Web routes for login/register pages
@auth_bp.route('/login-page', methods=['GET'])
def login_page():
    """Render login page"""
    return render_template('auth/login.html')

@auth_bp.route('/register-page', methods=['GET'])
def register_page():
    """Render register page"""
    return render_template('auth/register.html')