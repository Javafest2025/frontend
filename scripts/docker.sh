#!/bin/bash

# Scholar AI Frontend Docker Management Script
# This script provides commands to build, run, test, and manage the Docker containerized Frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="scholar-ai-frontend"
CONTAINER_NAME="scholar-frontend"
IMAGE_NAME="scholar-ai-frontend:latest"
COMPOSE_FILE="docker-compose.yml"
DEFAULT_PORT=3000

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "Docker is available and running"
}

# Get the appropriate docker compose command
get_docker_compose_cmd() {
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# Execute docker compose command with error handling
run_docker_compose() {
    local cmd="$1"
    local compose_cmd=$(get_docker_compose_cmd)
    
    if ! $compose_cmd -f $COMPOSE_FILE $cmd; then
        print_error "Docker compose command failed: $compose_cmd -f $COMPOSE_FILE $cmd"
        exit 1
    fi
}

# Function to build the Docker image
build() {
    print_status "Building Docker image for $APP_NAME..."
    
    check_docker
    run_docker_compose "build --no-cache"
    
    print_success "Docker image built successfully!"
}

# Function to rebuild the Docker image without cache
rebuild_nocache() {
    print_status "Rebuilding Docker image for $APP_NAME without cache..."
    
    check_docker
    
    # Remove existing image first
    run_docker_compose "down --rmi all"
    
    # Build fresh image without cache
    run_docker_compose "build --no-cache --pull"
    
    print_success "Docker image rebuilt successfully without cache!"
}

# Function to run the application
run() {
    print_status "Starting $APP_NAME container..."
    
    # Check if container is already running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_warning "Container $CONTAINER_NAME is already running"
        print_status "Use 'docker.sh stop' to stop it first"
        return 1
    fi
    
    check_docker
    run_docker_compose "up -d"
    
    print_success "Container started successfully!"
    print_status "Frontend is available at http://localhost:$DEFAULT_PORT"
    
    # Wait a moment and check if it started successfully
    sleep 5
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "Container failed to start. Check logs:"
        run_docker_compose "logs"
        exit 1
    fi
    
    print_success "$APP_NAME is running successfully!"
}

# Function to stop the application
stop() {
    print_status "Stopping $APP_NAME container..."
    
    check_docker
    run_docker_compose "down"
    
    print_success "Container stopped successfully!"
}

# Function to restart the application
restart() {
    print_status "Restarting $APP_NAME container..."
    stop
    sleep 2
    run
}

# Function to check application status
status() {
    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_success "Container $CONTAINER_NAME is running"
        print_status "Frontend: http://localhost:$DEFAULT_PORT"
        docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_warning "Container $CONTAINER_NAME is not running"
    fi
}

# Function to show logs
logs() {
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        run_docker_compose "logs -f $APP_NAME"
    else
        print_warning "Container $CONTAINER_NAME does not exist"
    fi
}

# Function to clean up
clean() {
    print_status "Cleaning up..."
    stop
    
    # Remove containers if they exist
    run_docker_compose "down --rmi all --volumes --remove-orphans"
    
    # Remove dangling images
    docker image prune -f
    
    print_success "Cleanup completed!"
}

# Function to build and start in one command
up() {
    print_status "Building and starting $APP_NAME..."
    build
    run
}

# Function to show help
show_help() {
    echo "Scholar AI Frontend Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build           Build the Docker image"
    echo "  rebuild-nocache Rebuild the Docker image without cache"
    echo "  run             Start the container"
    echo "  stop            Stop the container"
    echo "  restart         Restart the container"
    echo "  up              Build and start the application"
    echo "  status          Show container status"
    echo "  logs            Show container logs (follow mode)"
    echo "  clean           Stop containers, remove containers, images and volumes"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 run"
    echo "  $0 logs"
}

# Main script logic
main() {
    # Change to project root directory
    cd "$(dirname "$0")/.."
    
    # Check prerequisites
    check_docker
    
    case "${1:-help}" in
        "build")
            build
            ;;
        "rebuild-nocache")
            rebuild_nocache
            ;;
        "run")
            run
            ;;
        "stop")
            stop
            ;;
        "restart")
            restart
            ;;
        "up")
            up
            ;;
        "status")
            status
            ;;
        "logs")
            logs
            ;;
        "clean")
            clean
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 