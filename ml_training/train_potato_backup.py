import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as transforms
from PIL import Image
import pandas as pd
import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2
import timm
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
from tqdm import tqdm
import logging
from pathlib import Path
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PotatoDataset(Dataset):
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
        
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        label = self.labels[idx]
        
        # Load image
        image = Image.open(image_path).convert('RGB')
        image = np.array(image)
        
        if self.transform:
            image = self.transform(image=image)['image']
        
        return image, label

def create_dataset_manifest():
    """Create dataset manifest from potato images"""
    logger.info("Creating dataset manifest...")
    
    dataset_path = Path('dataset')
    healthy_path = dataset_path / 'healthy' / 'potato'
    diseased_path = dataset_path / 'diseased' / 'potato'
    
    # Get all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
    
    healthy_images = []
    diseased_images = []
    
    # Collect healthy images
    if healthy_path.exists():
        for img_file in healthy_path.iterdir():
            if img_file.suffix.lower() in image_extensions:
                healthy_images.append(str(img_file))
    
    # Collect diseased images
    if diseased_path.exists():
        for img_file in diseased_path.iterdir():
            if img_file.suffix.lower() in image_extensions:
                diseased_images.append(str(img_file))
    
    logger.info(f"Found {len(healthy_images)} healthy potato images")
    logger.info(f"Found {len(diseased_images)} diseased potato images")
    
    if len(healthy_images) == 0 and len(diseased_images) == 0:
        logger.error("No images found! Please add potato images to dataset/healthy/potato and dataset/diseased/potato")
        return None
    
    # Create labels
    labels = []
    image_paths = []
    
    # Add healthy images
    for img_path in healthy_images:
        image_paths.append(img_path)
        labels.append('healthy_potato')
    
    # Add diseased images
    for img_path in diseased_images:
        image_paths.append(img_path)
        labels.append('diseased_potato')
    
    # Create DataFrame
    df = pd.DataFrame({
        'image_path': image_paths,
        'label': labels,
        'plant_type': 'potato',
        'disease_type': ['none'] * len(healthy_images) + ['unknown'] * len(diseased_images),
        'split': 'train'
    })
    
    # Save manifest
    df.to_csv('dataset/labels.csv', index=False)
    logger.info(f"Dataset manifest created with {len(df)} images")
    
    return df

def train_model():
    """Train the potato disease classification model"""
    logger.info("Starting potato disease classification training...")
    
    # Create dataset manifest
    df = create_dataset_manifest()
    if df is None:
        return
    
    # Check if we have enough data
    if len(df) < 10:
        logger.warning(f"Only {len(df)} images found. Consider adding more images for better training.")
    
    # Create class mapping
    unique_classes = sorted(df['label'].unique())
    class_to_idx = {cls: idx for idx, cls in enumerate(unique_classes)}
    
    logger.info(f"Classes: {unique_classes}")
    logger.info(f"Class mapping: {class_to_idx}")
    
    # Add class indices
    df['class_idx'] = df['label'].map(class_to_idx)
    
    # Split into train and validation
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        df['image_path'].values,
        df['class_idx'].values,
        test_size=0.2,
        random_state=42,
        stratify=df['class_idx']
    )
    
    logger.info(f"Training samples: {len(train_paths)}")
    logger.info(f"Validation samples: {len(val_paths)}")
    
    # Define transforms
    train_transform = A.Compose([
        A.Resize(224, 224),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.2),
        A.RandomRotate90(p=0.3),
        A.RandomBrightnessContrast(p=0.3),
        A.RandomGamma(p=0.2),
        A.GaussNoise(p=0.2),
        A.Blur(blur_limit=3, p=0.1),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    
    val_transform = A.Compose([
        A.Resize(224, 224),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    
    # Create datasets
    train_dataset = PotatoDataset(train_paths, train_labels, train_transform)
    val_dataset = PotatoDataset(val_paths, val_labels, val_transform)
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=16,  # Smaller batch size for limited data
        shuffle=True,
        num_workers=2,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=16,
        shuffle=False,
        num_workers=2,
        pin_memory=True
    )
    
    # Create model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=len(unique_classes))
    model = model.to(device)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    logger.info(f"Total parameters: {total_params:,}")
    logger.info(f"Trainable parameters: {trainable_params:,}")
    
    # Define loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=20, eta_min=0.0001)
    
    # Training history
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    best_val_acc = 0.0
    best_model_state = None
    
    # Training loop
    epochs = 20  # Reduced epochs for initial training
    
    for epoch in range(epochs):
        logger.info(f"Epoch {epoch+1}/{epochs}")
        
        # Training
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(train_loader, desc="Training")
        for batch_idx, (data, target) in enumerate(pbar):
            data, target = data.to(device), target.to(device)
            
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()
            
            pbar.set_postfix({
                'Loss': f'{running_loss/(batch_idx+1):.4f}',
                'Acc': f'{100.*correct/total:.2f}%'
            })
        
        train_loss = running_loss / len(train_loader)
        train_acc = 100. * correct / total
        
        # Validation
        model.eval()
        running_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            pbar = tqdm(val_loader, desc="Validation")
            for data, target in pbar:
                data, target = data.to(device), target.to(device)
                output = model(data)
                loss = criterion(output, target)
                
                running_loss += loss.item()
                _, predicted = output.max(1)
                total += target.size(0)
                correct += predicted.eq(target).sum().item()
                
                pbar.set_postfix({
                    'Loss': f'{running_loss/(len(pbar)):.4f}',
                    'Acc': f'{100.*correct/total:.2f}%'
                })
        
        val_loss = running_loss / len(val_loader)
        val_acc = 100. * correct / total
        
        # Update history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = model.state_dict().copy()
            
            # Save model checkpoint
            os.makedirs('ml_training/models', exist_ok=True)
            checkpoint_path = f'ml_training/models/potato_model_epoch_{epoch+1}.pth'
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'class_names': unique_classes,
                'class_to_idx': class_to_idx
            }, checkpoint_path)
            
            logger.info(f"New best model saved: {checkpoint_path}")
        
        scheduler.step()
        
        logger.info(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
        logger.info(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        logger.info(f"Best Val Acc: {best_val_acc:.2f}%")
    
    # Save final model
    final_model_path = 'ml_training/models/potato_model_best.pth'
    torch.save({
        'model_state_dict': best_model_state,
        'class_names': unique_classes,
        'class_to_idx': class_to_idx,
        'val_acc': best_val_acc,
        'model_architecture': 'efficientnet_b0'
    }, final_model_path)
    
    logger.info(f"Training completed! Best validation accuracy: {best_val_acc:.2f}%")
    logger.info(f"Final model saved: {final_model_path}")
    
    # Plot training history
    plot_training_history(history)
    
    return history, best_val_acc

def plot_training_history(history):
    """Plot training history"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Plot loss
    ax1.plot(history['train_loss'], label='Train Loss')
    ax1.plot(history['val_loss'], label='Validation Loss')
    ax1.set_title('Model Loss')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.legend()
    
    # Plot accuracy
    ax2.plot(history['train_acc'], label='Train Accuracy')
    ax2.plot(history['val_acc'], label='Validation Accuracy')
    ax2.set_title('Model Accuracy')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.legend()
    
    plt.tight_layout()
    plt.savefig('ml_training/training_history.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    logger.info("Training history plot saved: ml_training/training_history.png")

if __name__ == '__main__':
    train_model()

