#!/usr/bin/env python3
"""
Flask application for Goose Context Management Tools API
"""

import os
import json
import logging
import subprocess
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, send_file, Response, render_template
from flask_cors import CORS

# Package directories
PACKAGE_DIR = Path(__file__).parent.parent
API_DIR = Path(__file__).parent
SCRIPTS_DIR = PACKAGE_DIR / "scripts"
WEB_DIR = PACKAGE_DIR / "web"
TEMPLATE_DIR = API_DIR / "templates"
STATIC_DIR = API_DIR / "static"

# User directories
HOME_DIR = Path.home()
SESSIONS_DIR = HOME_DIR / ".local" / "share" / "goose" / "sessions"
SESSION_META_DIR = HOME_DIR / ".local" / "share" / "goose" / "session_meta"
LOG_DIR = HOME_DIR / ".local" / "share" / "goose"
LOG_FILE = LOG_DIR / "api.log"

# Ensure directories exist
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
SESSION_META_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# API version
API_VERSION = "1.0.0"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE)
    ]
)
logger = logging.getLogger("goose_api")


def run_command(command):
    """Run a shell command and return the result"""
    try:
        logger.info(f"Running command: {command}")
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            universal_newlines=True
        )
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            logger.warning(f"Command failed with code {process.returncode}: {stderr}")
        return {
            "success": process.returncode == 0,
            "stdout": stdout,
            "stderr": stderr,
            "returncode": process.returncode
        }
    except Exception as e:
        logger.error(f"Exception running command: {str(e)}")
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }


def create_app(test_config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__, 
                static_folder=str(STATIC_DIR), 
                template_folder=str(TEMPLATE_DIR))
    
    # Enable CORS
    CORS(app)
    
    # Add error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('500.html'), 500
    
    # Serve dashboard at root
    @app.route("/", methods=["GET"])
    def serve_dashboard():
        """Serve the main dashboard"""
        try:
            # Pass the current time to the template for copyright year
            now = datetime.now()
            
            # Initialize empty stats - will be populated by JavaScript
            stats = {
                "total_sessions": 0,
                "active_sessions": 0,
                "tokens_saved": 0,
                "extractions_today": 0
            }
            
            return render_template("dashboard.html", now=now, stats=stats)
        except Exception as e:
            logging.error(f"Error serving dashboard: {str(e)}")
            return render_template("error.html", 
                                code="500",
                                title="Dashboard Error", 
                                message="Could not load the dashboard",
                                description=str(e)), 500
    
    # Serve static files
    @app.route("/<path:filename>", methods=["GET"])
    def serve_static(filename):
        """Serve static files"""
        # Check web directory first
        web_path = WEB_DIR / filename
        if web_path.exists():
            return send_from_directory(WEB_DIR, filename)
        
        # Then check package directory
        package_path = PACKAGE_DIR / filename
        if package_path.exists():
            return send_from_directory(PACKAGE_DIR, filename)
        
        return jsonify({"error": "File not found"}), 404
    
    @app.route("/api/version", methods=["GET"])
    def get_version():
        """Get API and tools version information"""
        return jsonify({
            "api_version": API_VERSION,
            "tools_version": run_command(f"{SCRIPTS_DIR}/goose_tools.sh version")["stdout"].strip()
        })
    
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Health check endpoint for monitoring and deployment"""
        return jsonify({
            "status": "ok",
            "version": API_VERSION,
            "uptime": "unknown"  # In a production version, track server start time and calculate uptime
        })
    
    @app.route("/api/web/extract", methods=["POST"])
    def extract_web():
        """Extract content from a web page"""
        data = request.json
        if not data or "url" not in data:
            return jsonify({"error": "URL is required"}), 400
        
        url = data["url"]
        output_file = data.get("output_file", "")
        options = data.get("options", {})
        
        # Create command
        cmd = f"{SCRIPTS_DIR}/extract_web.sh"
        
        # Add options
        for key, value in options.items():
            if isinstance(value, bool):
                if value:
                    cmd += f" --{key}"
            elif value:
                cmd += f" --{key} \"{value}\""
        
        # Add URL and optional output file
        cmd += f" \"{url}\""
        if output_file:
            cmd += f" \"{output_file}\""
        else:
            # Create a temporary file for output
            with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as f:
                output_file = f.name
            cmd += f" \"{output_file}\""
        
        # Run command
        result = run_command(cmd)
        
        # Return results
        if result["success"]:
            # Read the output file
            try:
                with open(output_file, "r") as f:
                    content = f.read()
                    
                # If the output file was temporary, delete it
                if "NamedTemporaryFile" in output_file:
                    os.unlink(output_file)
                    
                return jsonify({
                    "success": True,
                    "content": content,
                    "message": result["stdout"]
                })
            except Exception as e:
                logger.error(f"Failed to read output file: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": f"Failed to read output file: {str(e)}",
                    "message": result["stdout"]
                }), 500
        else:
            return jsonify({
                "success": False,
                "error": result["stderr"],
                "message": result["stdout"]
            }), 500
    
    @app.route("/api/code/extract", methods=["POST"])
    def extract_code():
        """Extract key components from a code file"""
        data = request.json
        if not data or "file_path" not in data:
            return jsonify({"error": "file_path is required"}), 400
        
        file_path = data["file_path"]
        output_file = data.get("output_file", "")
        options = data.get("options", {})
        
        # Create command
        cmd = f"{SCRIPTS_DIR}/extract_code.sh"
        
        # Add options
        for key, value in options.items():
            if isinstance(value, bool):
                if value:
                    cmd += f" --{key}"
            elif value:
                cmd += f" --{key} \"{value}\""
        
        # Add file path and optional output file
        cmd += f" \"{file_path}\""
        if output_file:
            cmd += f" \"{output_file}\""
        else:
            # Create a temporary file for output
            with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as f:
                output_file = f.name
            cmd += f" \"{output_file}\""
        
        # Run command
        result = run_command(cmd)
        
        # Return results
        if result["success"]:
            # Read the output file
            try:
                with open(output_file, "r") as f:
                    content = f.read()
                    
                # If the output file was temporary, delete it
                if "NamedTemporaryFile" in output_file:
                    os.unlink(output_file)
                    
                return jsonify({
                    "success": True,
                    "content": content,
                    "message": result["stdout"]
                })
            except Exception as e:
                logger.error(f"Failed to read output file: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": f"Failed to read output file: {str(e)}",
                    "message": result["stdout"]
                }), 500
        else:
            return jsonify({
                "success": False,
                "error": result["stderr"],
                "message": result["stdout"]
            }), 500
    
    @app.route("/api/sessions", methods=["GET"])
    def list_sessions():
        """List all available sessions with their metadata"""
        # Get sessions from the directory
        try:
            sessions = []
            for filename in os.listdir(SESSIONS_DIR):
                if filename.endswith(".jsonl"):
                    filepath = os.path.join(SESSIONS_DIR, filename)
                    basename = os.path.splitext(filename)[0]
                    metadata_path = os.path.join(SESSION_META_DIR, f"{basename}.meta")
                    
                    # Get basic file info
                    stats = os.stat(filepath)
                    session_info = {
                        "name": basename,
                        "file": filename,
                        "size": stats.st_size,
                        "created": datetime.fromtimestamp(stats.st_ctime).isoformat(),
                        "modified": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                    }
                    
                    # Add metadata if available
                    if os.path.exists(metadata_path):
                        with open(metadata_path, "r") as f:
                            metadata = {}
                            for line in f:
                                line = line.strip()
                                if line and not line.startswith("#"):
                                    key, value = line.split(":", 1)
                                    metadata[key.strip()] = value.strip()
                            session_info["metadata"] = metadata
                    
                    sessions.append(session_info)
            
            return jsonify({
                "success": True,
                "sessions": sessions
            })
        except Exception as e:
            logger.error(f"Error listing sessions: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route("/api/sessions/search", methods=["GET"])
    def search_sessions():
        """Search for sessions containing a specific keyword"""
        keyword = request.args.get("keyword", "")
        if not keyword:
            return jsonify({"error": "keyword parameter is required"}), 400
        
        # Run the search using the session script
        cmd = f"{SCRIPTS_DIR}/goose_session.sh --search \"{keyword}\""
        result = run_command(cmd)
        
        if result["success"]:
            return jsonify({
                "success": True,
                "results": result["stdout"]
            })
        else:
            return jsonify({
                "success": False,
                "error": result["stderr"],
                "message": result["stdout"]
            }), 500
    
    @app.route("/api/sessions/<session_name>", methods=["GET"])
    def get_session(session_name):
        """Get the content and metadata of a specific session"""
        # Check if session exists
        session_path = os.path.join(SESSIONS_DIR, f"{session_name}.jsonl")
        if not os.path.exists(session_path):
            # Try to find by partial match
            for filename in os.listdir(SESSIONS_DIR):
                if filename.endswith(".jsonl") and session_name in filename:
                    session_path = os.path.join(SESSIONS_DIR, filename)
                    session_name = os.path.splitext(filename)[0]
                    break
            else:
                return jsonify({
                    "success": False,
                    "error": f"Session not found: {session_name}"
                }), 404
        
        # Get session content
        try:
            with open(session_path, "r") as f:
                content = f.readlines()
            
            # Get metadata if available
            metadata_path = os.path.join(SESSION_META_DIR, f"{session_name}.meta")
            metadata = {}
            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            key, value = line.split(":", 1)
                            metadata[key.strip()] = value.strip()
            
            # Parse the JSONL content
            messages = []
            for line in content:
                if line.strip():
                    try:
                        message = json.loads(line)
                        messages.append(message)
                    except:
                        pass
            
            return jsonify({
                "success": True,
                "session": {
                    "name": session_name,
                    "metadata": metadata,
                    "messages": messages
                }
            })
        except Exception as e:
            logger.error(f"Error getting session {session_name}: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route("/api/clean", methods=["POST"])
    def clean_sessions():
        """Clean up old or large sessions"""
        data = request.json or {}
        
        # Create command
        cmd = f"{SCRIPTS_DIR}/clean_sessions.sh"
        
        # Add options
        for key, value in data.items():
            if isinstance(value, bool):
                if value:
                    cmd += f" --{key}"
            elif value is not None:
                cmd += f" --{key} \"{value}\""
        
        # Force non-interactive mode
        if "--preview" not in cmd and "--force" not in cmd:
            cmd += " --force"
        
        # Run command
        result = run_command(cmd)
        
        return jsonify({
            "success": result["success"],
            "output": result["stdout"],
            "error": result["stderr"] if not result["success"] else None
        })
    
    @app.route("/api/convert", methods=["POST"])
    def convert_content():
        """Convert content between different formats"""
        data = request.json
        if not data or "input_file" not in data or "format" not in data:
            return jsonify({"error": "input_file and format are required"}), 400
        
        input_file = data["input_file"]
        output_format = data["format"]
        output_file = data.get("output_file", "")
        
        # Create command
        cmd = f"{SCRIPTS_DIR}/goose_tools.sh convert \"{input_file}\" {output_format}"
        if output_file:
            cmd += f" \"{output_file}\""
        else:
            # Create a default output filename
            output_file = f"{os.path.splitext(input_file)[0]}.{output_format}"
            cmd += f" \"{output_file}\""
        
        # Run command
        result = run_command(cmd)
        
        # Return results
        if result["success"]:
            # Read the output file
            try:
                with open(output_file, "r") as f:
                    content = f.read()
                    
                return jsonify({
                    "success": True,
                    "content": content,
                    "output_file": output_file,
                    "message": result["stdout"]
                })
            except Exception as e:
                logger.error(f"Failed to read output file: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": f"Failed to read output file: {str(e)}",
                    "message": result["stdout"]
                }), 500
        else:
            return jsonify({
                "success": False,
                "error": result["stderr"],
                "message": result["stdout"]
            }), 500
    
    @app.route("/api/analytics/token_usage", methods=["GET"])
    def get_token_usage():
        """Get token usage statistics for sessions"""
        try:
            # Get range parameters
            days = int(request.args.get("days", 7))
            
            # Calculate the cutoff date
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Get all sessions
            sessions = []
            total_tokens = 0
            sessions_by_date = {}
            
            for filename in os.listdir(SESSIONS_DIR):
                if filename.endswith(".jsonl"):
                    filepath = os.path.join(SESSIONS_DIR, filename)
                    basename = os.path.splitext(filename)[0]
                    
                    # Get basic file info
                    stats = os.stat(filepath)
                    created_date = datetime.fromtimestamp(stats.st_ctime)
                    
                    # Skip if older than cutoff
                    if created_date < cutoff_date:
                        continue
                    
                    # Count tokens in the file
                    token_count = 0
                    with open(filepath, "r") as f:
                        for line in f:
                            if line.strip():
                                try:
                                    message = json.loads(line)
                                    # Estimate token count (rough approximation: 4 chars per token)
                                    content = message.get("content", "")
                                    token_count += len(content) / 4
                                except:
                                    pass
                    
                    # Format the date as YYYY-MM-DD
                    date_str = created_date.strftime("%Y-%m-%d")
                    if date_str not in sessions_by_date:
                        sessions_by_date[date_str] = {
                            "count": 0,
                            "tokens": 0
                        }
                    
                    sessions_by_date[date_str]["count"] += 1
                    sessions_by_date[date_str]["tokens"] += token_count
                    
                    total_tokens += token_count
                    
                    sessions.append({
                        "name": basename,
                        "created": created_date.isoformat(),
                        "token_count": int(token_count),
                        "size_bytes": stats.st_size
                    })
            
            # Sort the sessions by creation date
            sessions.sort(key=lambda x: x["created"], reverse=True)
            
            # Convert the sessions_by_date to a list for easier charting
            dates = []
            for date_str in sorted(sessions_by_date.keys()):
                dates.append({
                    "date": date_str,
                    "count": sessions_by_date[date_str]["count"],
                    "tokens": int(sessions_by_date[date_str]["tokens"])
                })
            
            return jsonify({
                "success": True,
                "total_sessions": len(sessions),
                "total_tokens": int(total_tokens),
                "avg_tokens_per_session": int(total_tokens / len(sessions)) if sessions else 0,
                "sessions": sessions,
                "dates": dates
            })
        except Exception as e:
            logger.error(f"Error in token usage analytics: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route("/api/analytics/session_growth", methods=["GET"])
    def get_session_growth():
        """Analyze session growth patterns"""
        try:
            session_name = request.args.get("session")
            if not session_name:
                return jsonify({"error": "session parameter is required"}), 400
                
            # Find the session file
            session_path = os.path.join(SESSIONS_DIR, f"{session_name}.jsonl")
            if not os.path.exists(session_path):
                # Try to find by partial match
                for filename in os.listdir(SESSIONS_DIR):
                    if filename.endswith(".jsonl") and session_name in filename:
                        session_path = os.path.join(SESSIONS_DIR, filename)
                        session_name = os.path.splitext(filename)[0]
                        break
                else:
                    return jsonify({
                        "success": False,
                        "error": f"Session not found: {session_name}"
                    }), 404
            
            # Analyze the session growth
            message_sizes = []
            total_size = 0
            role_distribution = {"user": 0, "assistant": 0, "system": 0, "other": 0}
            
            with open(session_path, "r") as f:
                for i, line in enumerate(f):
                    if line.strip():
                        try:
                            message = json.loads(line)
                            content = message.get("content", "")
                            role = message.get("role", "other")
                            
                            # Count tokens (rough approximation)
                            token_count = len(content) / 4
                            total_size += token_count
                            
                            # Update role distribution
                            if role in role_distribution:
                                role_distribution[role] += token_count
                            else:
                                role_distribution["other"] += token_count
                            
                            message_sizes.append({
                                "index": i,
                                "role": role,
                                "token_count": int(token_count),
                                "cumulative_tokens": int(total_size)
                            })
                        except:
                            pass
            
            # Calculate growth rate
            growth_rate = 0
            if len(message_sizes) > 1:
                growth_rate = total_size / len(message_sizes)
            
            # Get recommendations based on the analysis
            recommendations = []
            
            # Check if the session is getting too large
            if total_size > 100000:  # Approximate 100k tokens
                recommendations.append({
                    "type": "warning",
                    "message": "Session is very large and may encounter token limits. Consider starting a new session."
                })
            
            # Check if there's an imbalance in the role distribution
            user_ratio = role_distribution.get("user", 0) / total_size if total_size > 0 else 0
            if user_ratio < 0.2:
                recommendations.append({
                    "type": "suggestion",
                    "message": "User messages make up a small portion of the conversation. Consider more concise assistant responses."
                })
            
            # Check growth pattern
            if len(message_sizes) > 5:
                recent_growth = message_sizes[-1]["cumulative_tokens"] - message_sizes[-5]["cumulative_tokens"]
                if recent_growth > 20000:  # Approximate 20k tokens in last 5 messages
                    recommendations.append({
                        "type": "warning",
                        "message": "Recent messages are consuming tokens rapidly. Consider more concise responses."
                    })
            
            return jsonify({
                "success": True,
                "session_name": session_name,
                "total_messages": len(message_sizes),
                "total_tokens": int(total_size),
                "growth_rate": round(growth_rate, 2),
                "role_distribution": {k: int(v) for k, v in role_distribution.items()},
                "message_sizes": message_sizes,
                "recommendations": recommendations
            })
        except Exception as e:
            logger.error(f"Error in session growth analytics: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    
    @app.route("/api/analytics/dashboard-stats", methods=["GET"])
    def get_dashboard_stats():
        """Get statistics for the dashboard"""
        try:
            # Count total sessions
            session_files = list(SESSIONS_DIR.glob("*.json"))
            total_sessions = len(session_files)
            
            # Count active sessions (used in last 7 days)
            active_sessions = 0
            for session_file in session_files:
                if session_file.exists():
                    mtime = session_file.stat().st_mtime
                    age_days = (datetime.now().timestamp() - mtime) / (60 * 60 * 24)
                    if age_days <= 7:
                        active_sessions += 1
            
            # Calculate tokens saved estimate
            tokens_saved = 0
            for meta_file in SESSION_META_DIR.glob("*.meta.json"):
                if meta_file.exists():
                    try:
                        with open(meta_file, 'r') as f:
                            meta_data = json.load(f)
                            if 'tokens_saved' in meta_data:
                                tokens_saved += meta_data['tokens_saved']
                    except (json.JSONDecodeError, IOError):
                        pass
            
            # Count extractions today
            today = datetime.now().date()
            extractions_today = 0
            for log_file in LOG_DIR.glob("extraction_*.log"):
                if log_file.exists():
                    mtime = log_file.stat().st_mtime
                    log_date = datetime.fromtimestamp(mtime).date()
                    if log_date == today:
                        extractions_today += 1
            
            return jsonify({
                "total_sessions": total_sessions,
                "active_sessions": active_sessions,
                "tokens_saved": tokens_saved,
                "extractions_today": extractions_today
            })
            
        except Exception as e:
            logging.error(f"Error getting dashboard stats: {str(e)}")
            return jsonify({
                "total_sessions": 0,
                "active_sessions": 0,
                "tokens_saved": 0,
                "extractions_today": 0
            })
    
    return app


def run_app(app, host="127.0.0.1", port=5000, debug=False):
    """Run the Flask application.
    
    Args:
        app: The Flask application to run.
        host: The host to bind to.
        port: The port to bind to.
        debug: Whether to run in debug mode.
    """
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    """Run the application when executed directly."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Goose Tools API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=5000, help="Port to bind to")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    
    args = parser.parse_args()
    
    app = create_app()
    run_app(app, host=args.host, port=args.port, debug=args.debug)