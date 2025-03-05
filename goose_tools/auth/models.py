"""
User model for authentication
"""

import os
import json
from datetime import datetime
from pathlib import Path
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

class UserManager:
    """Manages user authentication and session management"""
    
    def __init__(self, config_dir=None):
        """Initialize the user manager"""
        # Use default config dir if not provided
        if config_dir is None:
            config_dir = Path.home() / ".config" / "goose" / "users"
        
        self.config_dir = Path(config_dir)
        self.users_file = self.config_dir / "users.json"
        
        # Ensure directories exist
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Load or create users file
        if not self.users_file.exists():
            self._save_users({})
    
    def _load_users(self):
        """Load users from the JSON file"""
        if not self.users_file.exists():
            return {}
            
        try:
            with open(self.users_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            # Return empty dict if file doesn't exist or is invalid
            return {}
    
    def _save_users(self, users):
        """Save users to the JSON file"""
        with open(self.users_file, 'w') as f:
            json.dump(users, f, indent=2)
    
    def create_user(self, username, password, email=None, admin=False):
        """Create a new user"""
        # Check if user already exists
        users = self._load_users()
        if username in users:
            return False, "Username already exists"
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create user entry
        users[username] = {
            "username": username,
            "password": password_hash,
            "email": email,
            "admin": admin,
            "created_at": datetime.now().isoformat(),
            "last_login": None
        }
        
        # Save users
        self._save_users(users)
        return True, "User created successfully"
    
    def authenticate(self, username, password):
        """Authenticate a user"""
        users = self._load_users()
        
        # Check if user exists
        if username not in users:
            return False, "Invalid username or password"
        
        # Check password
        user = users[username]
        if not bcrypt.check_password_hash(user["password"], password):
            return False, "Invalid username or password"
        
        # Update last login
        user["last_login"] = datetime.now().isoformat()
        self._save_users(users)
        
        return True, user
    
    def get_user(self, username):
        """Get user by username"""
        users = self._load_users()
        return users.get(username)
    
    def update_user(self, username, data):
        """Update user data (except password)"""
        users = self._load_users()
        
        # Check if user exists
        if username not in users:
            return False, "User not found"
        
        # Update user data
        user = users[username]
        for key, value in data.items():
            # Skip password updates through this method
            if key != "password":
                user[key] = value
        
        # Save users
        self._save_users(users)
        return True, "User updated successfully"
    
    def change_password(self, username, old_password, new_password):
        """Change user password"""
        # Authenticate first
        success, result = self.authenticate(username, old_password)
        if not success:
            return False, "Current password is incorrect"
        
        # Update password
        users = self._load_users()
        users[username]["password"] = bcrypt.generate_password_hash(new_password).decode('utf-8')
        
        # Save users
        self._save_users(users)
        return True, "Password changed successfully"
    
    def delete_user(self, username):
        """Delete a user"""
        users = self._load_users()
        
        # Check if user exists
        if username not in users:
            return False, "User not found"
        
        # Delete user
        del users[username]
        
        # Save users
        self._save_users(users)
        return True, "User deleted successfully"
    
    def list_users(self):
        """List all users (without passwords)"""
        users = self._load_users()
        
        # Remove passwords for security
        result = {}
        for username, user_data in users.items():
            user_copy = user_data.copy()
            user_copy.pop("password", None)
            result[username] = user_copy
            
        return result


# Create default admin user on first run
def create_default_admin(user_manager):
    """Create default admin user if no users exist"""
    users = user_manager._load_users()
    if not users:
        # Create default admin with random password or from environment
        default_password = os.environ.get("GOOSE_ADMIN_PASSWORD", "admin")
        user_manager.create_user("admin", default_password, admin=True)
        return True
    return False