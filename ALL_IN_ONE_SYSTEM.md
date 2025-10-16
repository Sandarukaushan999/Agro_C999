## Agro_C999 – All‑in‑One System Guide

This single document replaces scattered fix notes and partial guides. It covers architecture, setup, environments, ports, run/stop commands, model handling, troubleshooting, and what you can safely remove.

### Architecture
- **frontend**: Vite + React (dev on `5173`) talks to backend.
- **backend**: Node.js + Express (on `5000`), proxies prediction requests to ML service.
- **ml_service**: FastAPI + PyTorch (on `8000`) serving image predictions.
- **infra**: Docker Compose for local stack (optional DB/services).
- **ml_training**: Offline training scripts and model artifacts.

### Default Ports
- frontend: `5173`
- backend: `5000` (endpoint: `/api/...`, health: `/health`)
- ml_service: `8000` (endpoints: `/health`, `/predict`)

### Environment Variables

Backend (`backend/.env`)
- `PORT=5000`
- `FRONTEND_URL=http://localhost:5173`
- `ML_SERVICE_URL=http://localhost:8000`
- `MONGO_URI=mongodb://localhost:27017/agro_c` (or your Mongo connection)

Frontend (`frontend/.env`)
- `VITE_API_BASE=http://localhost:5000`
- Firebase web config (if not hardcoded):
  - `VITE_FIREBASE_API_KEY=...`
  - `VITE_FIREBASE_AUTH_DOMAIN=...`
  - `VITE_FIREBASE_PROJECT_ID=...`
  - `VITE_FIREBASE_STORAGE_BUCKET=...`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
  - `VITE_FIREBASE_APP_ID=...`
  - `VITE_FIREBASE_MEASUREMENT_ID=...`

ML Service (`ml_service/.env`)
- `HOST=0.0.0.0`
- `PORT=8000`
- `MODEL_PATH=models/potato_model_best.pth`
- `DATASET_PATH=dataset` (if needed for local tests)
- `MLFLOW_TRACKING_URI=http://localhost:5000` (optional)
- `LOG_LEVEL=INFO`

Tip: Commit `.env.example` files (no secrets) mirroring the above to help onboarding.

### Starting Services

All at once (Windows)
- Run `start_all_services.bat` (spawns separate terminal windows for each service).
- ML service line should be:
  - `start "ML Service" cmd /k "venv\Scripts\activate && python main.py"`

Individually
- Backend
  - `cd backend && npm install && npm start`
- Frontend
  - `cd frontend && npm install && npm run dev`
- ML Service
  - `cd ml_service`
  - Create venv: `python -m venv venv`
  - `venv\Scripts\pip install -r requirements.txt`
  - Start: `venv\Scripts\python.exe main.py`

Docker (optional)
- `cd infra`
- `docker-compose -f docker-compose-simple.yml up`

### APIs
- Backend health: `GET http://localhost:5000/health`
- ML service health: `GET http://localhost:8000/health`
- Prediction flow:
  - Backend test: `POST http://localhost:5000/api/test-predict` with JSON `{ imageData: "data:image/jpeg;base64,..." }`
  - ML service direct: `POST http://localhost:8000/predict` with multipart `file`.

### Models
- Runtime model file expected at `ml_service/models/potato_model_best.pth`.
- If training locally, copy from `ml_training/models/potato_model_best.pth` to the ML service `models/` folder.
- For automation, add a simple fetch script or document manual placement.

### Project Maintenance
- Node: reinstall any time via `npm install` under `backend` and `frontend`.
- Python: recreate ML venv any time: delete `ml_service/venv/`, then run venv + install.
- Ignored artifacts (`.gitignore`): `node_modules/`, `logs/`, `.env`, `venv/`, `__pycache__/`, `*.pyc`, model artifacts.

### Troubleshooting
- 500 on `/api/test-predict`:
  - Ensure ML service `/health` is healthy on `8000`.
  - Check `ML_SERVICE_URL` in `backend/.env`.
  - Confirm backend logs in `backend/logs/` for error details.
- ML service fails to start:
  - Confirm `pydantic-settings` is installed (in `ml_service/requirements.txt`).
  - Ensure `MODEL_PATH` exists or fallback model initializes.
- Frontend cannot reach backend:
  - Check `VITE_API_BASE` and CORS in backend.

### Safe‑to‑Remove Legacy Docs (Consolidated here)
You can delete these after adopting this file:
- `ALL_FIXES_SUMMARY.md`
- `AUTH_FIX_SUMMARY.md`
- `CSS_STYLING_FIX.md`
- `DISEASED_PREDICTION_FIX.md`
- `FIREBASE_FIXES_COMPLETE.md`
- `FIREBASE_IMPLEMENTATION_SUMMARY.md`
- `FIXES_SUMMARY.md`
- `FRONTEND_MAP_ERROR_FIX.md`
- `GRADIENT_ERROR_FIX.md`
- `PREDICTION_HISTORY_FIXED.md`

Optional to keep (utility scripts/docs). Remove only if you don’t use them:
- `create_tomato_labels.py`, `organize_potato_images.py`, `organize_tomato_images.py`, `verify_model.py`, `project_scanner.py`
- `scan_and_start.bat`, `fix_frontend_map_error.bat`, `setup.sh`
- Training helpers: `train_potato.bat`, `train_tomato.bat`, `train_vegetables.bat`, `POTATO_TRAINING_GUIDE.md`, `setup_firebase.md`, `FIREBASE_SETUP_GUIDE.md`, `TROUBLESHOOTING.md`

### Housekeeping Checklist
- Add and commit `.env.example` files for backend, frontend, ml_service.
- Ensure `start_all_services.bat` ML line uses `python main.py` as above.
- Document model placement/fetch step for `ml_service/models/`.
- Optionally add a cleanup script to purge `node_modules/`, `venv/`, logs.




