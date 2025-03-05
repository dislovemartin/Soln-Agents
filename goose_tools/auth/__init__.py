"""
Authentication module for Goose Tools
"""

from flask import Blueprint

from goose_tools.auth.models import UserManager
from goose_tools.auth.utils import init_auth, admin_required
from goose_tools.auth.views import auth_bp

__all__ = ['UserManager', 'init_auth', 'admin_required', 'auth_bp']