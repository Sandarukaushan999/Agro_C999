#!/bin/bash

# Agro_C Setup Script
# This script sets up the complete Agro_C plant disease identification system

set -e

echo "🌱 Setting up Agro_C Plant Disease Identification System"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Some features may not work."
        return
    fi
    
    NODE_VERSION=$(node --version)
    print_status "Node.js $NODE_VERSION is installed"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 is not installed. ML features may not work."
        return
    fi
    
    PYTHON_VERSION=$(python3 --version)
    print_status "$PYTHON_VERSION is installed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p dataset/healthy
    mkdir -p dataset/diseased
    mkdir -p ml_training/models
    mkdir -p ml_service/models
    mkdir -p ml_service/explanations
    
    print_status "Directories created successfully"
}

# Setup environment files
setup_env_files() {
    print_status "Setting up environment files..."
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://mongo:27017/agro_c
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=30d
ML_SERVICE_URL=http://ml_service:8000
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=agro-images
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
EOF
        print_status "Created backend/.env"
    fi
    
    # ML Service .env
    if [ ! -f ml_service/.env ]; then
        cat > ml_service/.env << EOF
MODEL_PATH=models/model_best.pth
DATASET_PATH=dataset
MLFLOW_TRACKING_URI=http://mlflow:5000
LOG_LEVEL=INFO
EOF
        print_status "Created ml_service/.env"
    fi
    
    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:5000
VITE_ML_SERVICE_URL=http://localhost:8000
EOF
        print_status "Created frontend/.env"
    fi
}

# Install dependencies (if Node.js is available)
install_dependencies() {
    if command -v npm &> /dev/null; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
        
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
        
        print_status "Dependencies installed successfully"
    else
        print_warning "npm not found. Skipping dependency installation."
    fi
}

# Setup Python environment (if Python is available)
setup_python_env() {
    if command -v python3 &> /dev/null; then
        print_status "Setting up Python environment..."
        
        # ML Service
        if [ -f ml_service/requirements.txt ]; then
            cd ml_service
            python3 -m venv venv
            source venv/bin/activate
            pip install -r requirements.txt
            deactivate
            cd ..
            print_status "ML Service Python environment created"
        fi
        
        # ML Training
        if [ -f ml_training/requirements.txt ]; then
            cd ml_training
            python3 -m venv venv
            source venv/bin/activate
            pip install -r requirements.txt
            deactivate
            cd ..
            print_status "ML Training Python environment created"
        fi
    else
        print_warning "Python 3 not found. Skipping Python environment setup."
    fi
}

# Start services with Docker Compose
start_services() {
    print_status "Starting services with Docker Compose..."
    
    cd infra
    docker-compose up -d --build
    
    print_status "Services started successfully!"
    print_status "Services are running on:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost:5000"
    echo "  - ML Service: http://localhost:8000"
    echo "  - MongoDB: localhost:27017"
    echo "  - MinIO: http://localhost:9000"
    echo "  - MLflow: http://localhost:5000"
    
    cd ..
}

# Populate database with sample data
populate_database() {
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_status "Populating database with sample solutions..."
    
    if [ -f backend/scripts/populate-solutions.js ]; then
        cd backend
        node scripts/populate-solutions.js
        cd ..
        print_status "Database populated successfully"
    else
        print_warning "Population script not found. Skipping database population."
    fi
}

# Main setup function
main() {
    echo "Starting Agro_C setup..."
    echo ""
    
    # Check prerequisites
    check_docker
    check_nodejs
    check_python
    
    echo ""
    
    # Setup
    create_directories
    setup_env_files
    install_dependencies
    setup_python_env
    
    echo ""
    
    # Start services
    start_services
    
    echo ""
    
    # Populate database
    populate_database
    
    echo ""
    echo "🎉 Agro_C setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Visit http://localhost:5173 to access the application"
    echo "2. Register a new account or use the demo credentials"
    echo "3. Upload plant images to test the disease identification"
    echo "4. Check the MLflow UI at http://localhost:5000 for experiment tracking"
    echo ""
    echo "To stop the services, run: cd infra && docker-compose down"
    echo "To view logs, run: cd infra && docker-compose logs -f"
}

# Run main function
main "$@"
