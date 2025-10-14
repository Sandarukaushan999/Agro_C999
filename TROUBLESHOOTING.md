# Agro_C Troubleshooting Guide

## Issues Fixed

### 1. Missing Environment Files
**Problem**: No `.env` files for service configuration
**Solution**: Created `setup_environment.bat` to generate:
- `backend/.env` - Backend API configuration
- `ml_service/.env` - ML service configuration  
- `frontend/.env` - Frontend configuration

### 2. ML Service Configuration Error
**Problem**: Pydantic validation error for extra fields in `.env`
**Solution**: Updated `ml_service/app/config.py` to:
- Add missing `HOST` and `PORT` fields
- Set `extra = "ignore"` to ignore extra fields

### 3. Frontend Build Issues
**Problem**: Missing TypeScript configuration and page components
**Solution**: 
- Created `frontend/tsconfig.json` and `frontend/tsconfig.node.json`
- Created missing page components: Solutions, Profile, Login, Register
- Fixed TypeScript import issues in `api.ts`
- Created missing `frontend/index.html`
- Fixed CSS import order in `index.css`

### 4. Port Conflicts
**Problem**: Services trying to use ports already in use
**Solution**: Added process cleanup in startup scripts

## How to Start the System

### Option 1: Simple Start (Recommended)
```bash
simple_start.bat
```

### Option 2: Manual Start
```bash
setup_environment.bat
start_services_fixed.bat
```

### Option 3: Individual Services
```bash
# ML Service
cd ml_service
venv\Scripts\activate
python main.py

# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

## Service URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000

## Health Checks
- ML Service: http://localhost:8000/health
- Backend: http://localhost:5000/health

## Common Issues

### Model Not Found
```
❌ Trained model not found!
```
**Solution**: Run `train_potato.bat` first to train the model

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill existing processes or restart the system

### Services Not Starting
**Check**:
1. All dependencies installed (`npm install` in frontend/backend)
2. Python virtual environment activated (`venv\Scripts\activate`)
3. Environment files created (`setup_environment.bat`)

### Frontend Build Errors
**Check**:
1. TypeScript configuration files exist
2. All page components are created
3. CSS import order is correct

## Testing the System

1. **Start all services**: `simple_start.bat`
2. **Wait 30 seconds** for services to initialize
3. **Visit**: http://localhost:5173
4. **Upload a potato image** to test the trained model
5. **Check predictions** and solutions

## Model Information
- **Model File**: `ml_service/models/potato_model_best.pth` (16MB)
- **Classes**: `diseased_potato`, `healthy_potato`
- **Framework**: PyTorch with EfficientNet-B0
- **Input Size**: 224x224 pixels

## Next Steps
1. Add more plant types to the dataset
2. Train models for other crops
3. Expand the solutions database
4. Add user authentication features
