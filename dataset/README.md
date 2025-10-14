# Dataset Structure for Agro_C Plant Disease Identification

This directory contains the plant image dataset organized for training the ML model.

## Directory Structure

```
dataset/
├── healthy/                    # Healthy plant images
│   ├── strawberry/            # Healthy strawberry leaves
│   ├── tomato/                # Healthy tomato leaves
│   ├── apple/                 # Healthy apple leaves
│   ├── corn/                  # Healthy corn leaves
│   ├── potato/                # Healthy potato leaves
│   └── grape/                 # Healthy grape leaves
│
├── diseased/                  # Diseased plant images
│   ├── powdery_mildew/        # Powdery mildew disease
│   │   ├── strawberry/        # Strawberry powdery mildew
│   │   ├── tomato/            # Tomato powdery mildew
│   │   └── apple/             # Apple powdery mildew
│   │
│   ├── bacterial_spot/         # Bacterial spot disease
│   │   ├── tomato/            # Tomato bacterial spot
│   │   ├── pepper/             # Pepper bacterial spot
│   │   └── cucumber/          # Cucumber bacterial spot
│   │
│   ├── leaf_blight/           # Leaf blight disease
│   │   ├── corn/              # Corn leaf blight
│   │   ├── potato/            # Potato leaf blight
│   │   └── tomato/            # Tomato leaf blight
│   │
│   ├── rust/                  # Rust disease
│   │   ├── wheat/             # Wheat rust
│   │   ├── barley/            # Barley rust
│   │   └── corn/              # Corn rust
│   │
│   ├── anthracnose/           # Anthracnose disease
│   │   ├── tomato/            # Tomato anthracnose
│   │   ├── pepper/            # Pepper anthracnose
│   │   └── cucumber/          # Cucumber anthracnose
│   │
│   └── mosaic_virus/          # Mosaic virus
│       ├── tomato/            # Tomato mosaic virus
│       ├── cucumber/          # Cucumber mosaic virus
│       └── pepper/            # Pepper mosaic virus
│
├── test/                      # Test dataset (20% of total)
│   ├── healthy/
│   └── diseased/
│
├── validation/                # Validation dataset (20% of total)
│   ├── healthy/
│   └── diseased/
│
├── labels.csv                 # Dataset manifest with labels
├── train_labels.csv           # Training set labels
├── test_labels.csv            # Test set labels
└── validation_labels.csv      # Validation set labels
```

## Image Requirements

- **Format**: JPG, PNG, or JPEG
- **Resolution**: Minimum 224x224 pixels (recommended 512x512)
- **Quality**: High-quality images with clear visibility of disease symptoms
- **Lighting**: Good lighting conditions, avoid shadows
- **Background**: Clean background preferred
- **Angle**: Multiple angles of the same plant/leaf

## Dataset Preparation Guidelines

1. **Image Collection**:
   - Collect images from various sources (field, greenhouse, laboratory)
   - Ensure diversity in lighting conditions and angles
   - Include images from different growth stages

2. **Labeling**:
   - Each image should be properly labeled
   - Use consistent naming conventions
   - Verify labels for accuracy

3. **Data Split**:
   - Training: 60% of total dataset
   - Validation: 20% of total dataset
   - Test: 20% of total dataset

4. **Augmentation**:
   - The training pipeline will apply data augmentation
   - Includes rotation, flipping, color jittering, etc.

## Usage in Training Pipeline

The ML training pipeline will:
1. Load images from the dataset directory
2. Apply preprocessing and augmentation
3. Split data into train/validation/test sets
4. Train the model using PyTorch
5. Save model artifacts to `ml_training/models/`

## Adding New Plant/Disease Types

To add new plant types or diseases:
1. Create new directories under `healthy/` or `diseased/`
2. Add images following the naming convention
3. Update the labels.csv file
4. Retrain the model

## Notes

- This directory is excluded from git commits (see .gitignore)
- Images should be stored locally or in cloud storage
- Consider using data versioning tools like DVC for large datasets
- Regular backup of the dataset is recommended
