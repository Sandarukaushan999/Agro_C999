import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data

def test_model_info():
    """Test model info endpoint"""
    response = client.get("/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert "version" in data
    assert "architecture" in data

def test_predict_endpoint_invalid_file():
    """Test prediction endpoint with invalid file"""
    response = client.post("/predict", files={"image": ("test.txt", b"not an image", "text/plain")})
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_predict_endpoint_no_file():
    """Test prediction endpoint with no file"""
    response = client.post("/predict")
    assert response.status_code == 422  # Validation error
