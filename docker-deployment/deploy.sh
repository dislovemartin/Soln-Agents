#!/bin/bash

# SolnAI Deployment Script

# Function to display help message
show_help() {
    echo "SolnAI Deployment Script"
    echo "------------------------"
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start SolnAI containers"
    echo "  stop        - Stop SolnAI containers"
    echo "  restart     - Restart SolnAI containers"
    echo "  status      - Check status of SolnAI containers"
    echo "  logs        - View logs from SolnAI containers"
    echo "  update      - Update SolnAI to the latest version"
    echo "  help        - Show this help message"
    echo ""
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "Error: Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check and create directories if they don't exist
setup_directories() {
    # Extract storage path from .env file or use default
    STORAGE_PATH=$(grep SOLNAI_STORAGE_PATH .env | cut -d '=' -f2 || echo "/home/nvidia/system_monitoring/SolnAI/storage")
    AGENTS_PATH=$(grep SOLNAI_AGENTS_PATH .env | cut -d '=' -f2 || echo "/home/nvidia/system_monitoring/SolnAI/agents")
    SCREENSHOTS_PATH="./screenshots"
    
    # Create directories if they don't exist
    mkdir -p "$STORAGE_PATH"
    mkdir -p "$AGENTS_PATH"
    mkdir -p "$SCREENSHOTS_PATH"
    
    echo "Directory setup complete:"
    echo " - Storage path: $STORAGE_PATH"
    echo " - Agents path: $AGENTS_PATH"
    echo " - Screenshots path: $SCREENSHOTS_PATH"
}

# Start SolnAI
start_solnai() {
    echo "Setting up required directories..."
    setup_directories
    
    echo "Starting SolnAI..."
    docker-compose up -d
    echo "SolnAI is now running at http://localhost:3001"
    echo "Browser Tools MCP is running at http://localhost:3027"
    echo "CrewAI Service is running at http://localhost:8001"
}

# Stop SolnAI
stop_solnai() {
    echo "Stopping SolnAI..."
    docker-compose down
    echo "SolnAI has been stopped."
}

# Restart SolnAI
restart_solnai() {
    echo "Restarting SolnAI..."
    docker-compose restart
    echo "SolnAI has been restarted."
}

# Check status of SolnAI
status_solnai() {
    echo "SolnAI container status:"
    docker-compose ps
}

# View logs from SolnAI
logs_solnai() {
    echo "Viewing SolnAI logs (press Ctrl+C to exit):"
    docker-compose logs -f
}

# Update SolnAI
update_solnai() {
    echo "Updating SolnAI system to the latest version..."
    
    # Pull latest version of main image
    docker-compose pull solnai
    
    # Rebuild custom services
    echo "Rebuilding custom services..."
    docker-compose build browser-tools-mcp browser-tools-server crewai-service
    
    # Restart all services
    docker-compose up -d
    
    echo "SolnAI system has been updated to the latest version."
    echo "Services running:"
    docker-compose ps
}

# Main script execution
check_docker

# Process command line arguments
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

case "$1" in
    start)
        start_solnai
        ;;
    stop)
        stop_solnai
        ;;
    restart)
        restart_solnai
        ;;
    status)
        status_solnai
        ;;
    logs)
        logs_solnai
        ;;
    update)
        update_solnai
        ;;
    help)
        show_help
        ;;
    *)
        echo "Error: Unknown command '$1'"
        show_help
        exit 1
        ;;
esac

exit 0 