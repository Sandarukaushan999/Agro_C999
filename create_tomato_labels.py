import os
import pandas as pd
from pathlib import Path
import random

def create_tomato_labels():
    """Create labels.csv file for tomato dataset"""
    
    # Dataset paths
    dataset_path = Path("dataset")
    healthy_path = dataset_path / "healthy" / "tomato"
    diseased_path = dataset_path / "diseased" / "tomato"
    
    # Get all image files
    healthy_images = []
    diseased_images = []
    
    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
    
    # Collect healthy images
    if healthy_path.exists():
        for file_path in healthy_path.iterdir():
            if file_path.suffix in image_extensions:
                healthy_images.append(str(file_path))
    
    # Collect diseased images
    if diseased_path.exists():
        for file_path in diseased_path.iterdir():
            if file_path.suffix in image_extensions:
                diseased_images.append(str(file_path))
    
    print(f"Found {len(healthy_images)} healthy tomato images")
    print(f"Found {len(diseased_images)} diseased tomato images")
    
    # Create labels data
    labels_data = []
    
    # Add healthy images
    for img_path in healthy_images:
        labels_data.append({
            'image_path': img_path,
            'label': 'healthy_tomato',
            'plant_type': 'tomato',
            'disease_type': 'none',
            'split': 'train'  # We'll split later
        })
    
    # Add diseased images
    for img_path in diseased_images:
        labels_data.append({
            'image_path': img_path,
            'label': 'diseased_tomato',
            'plant_type': 'tomato',
            'disease_type': 'bacterial_spot',  # Main disease type in dataset
            'split': 'train'  # We'll split later
        })
    
    # Create DataFrame
    df = pd.DataFrame(labels_data)
    
    # Shuffle the data
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Split into train/validation/test (70/20/10)
    total_samples = len(df)
    train_size = int(0.7 * total_samples)
    val_size = int(0.2 * total_samples)
    
    # Assign splits
    df.loc[:train_size-1, 'split'] = 'train'
    df.loc[train_size:train_size+val_size-1, 'split'] = 'validation'
    df.loc[train_size+val_size:, 'split'] = 'test'
    
    # Save the labels file
    labels_file = dataset_path / 'tomato_labels.csv'
    df.to_csv(labels_file, index=False)
    
    print(f"\n✅ Created tomato_labels.csv with {len(df)} samples")
    print(f"   Train: {len(df[df['split'] == 'train'])} samples")
    print(f"   Validation: {len(df[df['split'] == 'validation'])} samples")
    print(f"   Test: {len(df[df['split'] == 'test'])} samples")
    
    # Show class distribution
    print(f"\n📊 Class distribution:")
    print(df['label'].value_counts())
    
    return labels_file

if __name__ == "__main__":
    create_tomato_labels()
