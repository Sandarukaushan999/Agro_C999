# Agro_C - Plant Disease Identification System

A comprehensive MERN-based application with Python ML service for identifying plant diseases and providing solutions.

## 🌱 Features

- **Plant Disease Detection**: Upload plant images and get instant disease identification
- **High Accuracy ML Model**: PyTorch-based deep learning model for plant disease classification
- **Solution Database**: Hardcoded solutions with user ratings and comments
- **User Management**: Authentication and user profiles
- **Real-time Predictions**: FastAPI-based ML inference service
- **Responsive UI**: Modern React frontend with Tailwind CSS
- **Scalable Architecture**: Docker containerization and Kubernetes deployment

## 🏗️ Architecture

```
Agro_C/
├── frontend/          # React + TypeScript + Tailwind CSS
├── backend/           # Express.js + MongoDB + JWT Auth
├── ml_service/        # FastAPI + PyTorch ML Inference
├── ml_training/       # PyTorch Training Pipeline
├── dataset/           # Plant Image Dataset
├── infra/             # Docker & Kubernetes Configs
└── .github/workflows/ # CI/CD Pipeline
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- MongoDB

### Local Development

1. **Clone and setup**:
```bash
git clone <your-repo>
cd C_Agro
```

2. **Start with Docker Compose**:
```bash
cd infra
docker-compose up --build
```

3. **Access the application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000
- MongoDB: localhost:27017

### Manual Setup

1. **Backend**:
```bash
cd backend
npm install
npm run dev
```

2. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

3. **ML Service**:
```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 📊 Dataset Structure

```
dataset/
├── healthy/
│   ├── strawberry/
│   ├── tomato/
│   └── apple/
└── diseased/
    ├── powdery_mildew/
    ├── bacterial_spot/
    └── leaf_blight/
```

## 🤖 ML Model

- **Framework**: PyTorch
- **Architecture**: EfficientNet-B0 (transfer learning)
- **Training**: Albumentations for data augmentation
- **Monitoring**: MLflow for experiment tracking
- **Inference**: FastAPI with Grad-CAM explanations

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service:

**Backend (.env)**:
```
MONGO_URI=mongodb://localhost:27017/agro_c
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:8000
PORT=5000
```

**ML Service (.env)**:
```
MODEL_PATH=models/model_best.pth
MLFLOW_TRACKING_URI=http://localhost:5000
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# ML Service tests
cd ml_service && pytest
```

## 🚀 Deployment

### Docker
```bash
docker-compose -f infra/docker-compose.prod.yml up -d
```

### Kubernetes
```bash
kubectl apply -f infra/k8s/
```

## 📈 Monitoring

- **Metrics**: Prometheus + Grafana
- **Logs**: Centralized logging with Winston
- **Errors**: Sentry integration
- **ML Monitoring**: Model performance tracking

## 🔒 Security

- JWT-based authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- File upload security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@agro-c.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced ML models (Vision Transformers)
- [ ] Real-time disease monitoring
- [ ] Integration with IoT sensors
- [ ] Farmer community features
