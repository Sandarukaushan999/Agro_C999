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
import mlflow
import mlflow.pytorch
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import logging
from pathlib import Path
import json
from datetime import datetime
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlantDiseaseDataset(Dataset):
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

class TomatoDiseaseTrainer:
    def __init__(self, config):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.class_names = []
        self.train_loader = None
        self.val_loader = None
        self.test_loader = None
        
        # Setup MLflow
        mlflow.set_tracking_uri(config.mlflow_uri)
        mlflow.set_experiment(config.experiment_name)
        
    def prepare_data(self):
        """Prepare datasets and data loaders"""
        logger.info("Preparing tomato datasets...")
        
        # Load dataset manifest
        labels_file = self.config.dataset_path / 'tomato_labels.csv'
        if not labels_file.exists():
            logger.error(f"Tomato labels file not found. Please run create_tomato_labels.py first.")
            sys.exit(1)
        df = pd.read_csv(labels_file)
        
        # Filter out test and validation sets if they exist
        train_df = df[df['split'] == 'train'].copy()
        
        # Create class mapping
        unique_classes = sorted(train_df['label'].unique())
        self.class_names = unique_classes
        class_to_idx = {cls: idx for idx, cls in enumerate(unique_classes)}
        
        # Add class indices
        train_df['class_idx'] = train_df['label'].map(class_to_idx)
        
        # Split into train and validation
        train_paths, val_paths, train_labels, val_labels = train_test_split(
            train_df['image_path'].values,
            train_df['class_idx'].values,
            test_size=0.2,
            random_state=42,
            stratify=train_df['class_idx']
        )
        
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
        train_dataset = PlantDiseaseDataset(train_paths, train_labels, train_transform)
        val_dataset = PlantDiseaseDataset(val_paths, val_labels, val_transform)
        
        # Create data loaders
        self.train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=self.config.num_workers,
            pin_memory=True
        )
        
        self.val_loader = DataLoader(
            val_dataset,
            batch_size=self.config.batch_size,
            shuffle=False,
            num_workers=self.config.num_workers,
            pin_memory=True
        )
        
        logger.info(f"Training samples: {len(train_dataset)}")
        logger.info(f"Validation samples: {len(val_dataset)}")
        logger.info(f"Number of classes: {len(self.class_names)}")
        logger.info(f"Class names: {self.class_names}")
        
    def create_model(self):
        """Create and initialize the model"""
        logger.info("Creating tomato disease classification model...")
        
        # Create model
        self.model = timm.create_model(
            self.config.model_name,
            pretrained=True,
            num_classes=len(self.class_names)
        )
        
        # Move to device
        self.model = self.model.to(self.device)
        
        # Count parameters
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        logger.info(f"Total parameters: {total_params:,}")
        logger.info(f"Trainable parameters: {trainable_params:,}")
        
    def train_epoch(self, optimizer, criterion, scheduler=None):
        """Train for one epoch"""
        self.model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(self.train_loader, desc="Training")
        for batch_idx, (data, target) in enumerate(pbar):
            data, target = data.to(self.device), target.to(self.device)
            
            optimizer.zero_grad()
            output = self.model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()
            
            # Update progress bar
            pbar.set_postfix({
                'Loss': f'{running_loss/(batch_idx+1):.4f}',
                'Acc': f'{100.*correct/total:.2f}%'
            })
            
            if scheduler:
                scheduler.step()
        
        epoch_loss = running_loss / len(self.train_loader)
        epoch_acc = 100. * correct / total
        
        return epoch_loss, epoch_acc
    
    def validate_epoch(self, criterion):
        """Validate for one epoch"""
        self.model.eval()
        running_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            pbar = tqdm(self.val_loader, desc="Validation")
            for data, target in pbar:
                data, target = data.to(self.device), target.to(self.device)
                output = self.model(data)
                loss = criterion(output, target)
                
                running_loss += loss.item()
                _, predicted = output.max(1)
                total += target.size(0)
                correct += predicted.eq(target).sum().item()
                
                pbar.set_postfix({
                    'Loss': f'{running_loss/(len(pbar)):.4f}',
                    'Acc': f'{100.*correct/total:.2f}%'
                })
        
        epoch_loss = running_loss / len(self.val_loader)
        epoch_acc = 100. * correct / total
        
        return epoch_loss, epoch_acc
    
    def train(self):
        """Main training loop"""
        logger.info("Starting tomato disease classification training...")
        
        # Create model
        self.create_model()
        
        # Define loss and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(
            self.model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay
        )
        
        # Learning rate scheduler
        scheduler = optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=self.config.epochs,
            eta_min=self.config.learning_rate * 0.01
        )
        
        # Training history
        history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': []
        }
        
        best_val_acc = 0.0
        best_model_state = None
        
        # Start MLflow run
        with mlflow.start_run():
            # Log parameters
            mlflow.log_params({
                'model_name': self.config.model_name,
                'batch_size': self.config.batch_size,
                'learning_rate': self.config.learning_rate,
                'weight_decay': self.config.weight_decay,
                'epochs': self.config.epochs,
                'num_classes': len(self.class_names),
                'class_names': json.dumps(self.class_names),
                'plant_type': 'tomato'
            })
            
            # Training loop
            for epoch in range(self.config.epochs):
                logger.info(f"Epoch {epoch+1}/{self.config.epochs}")
                
                # Train
                train_loss, train_acc = self.train_epoch(optimizer, criterion, scheduler)
                
                # Validate
                val_loss, val_acc = self.validate_epoch(criterion)
                
                # Update history
                history['train_loss'].append(train_loss)
                history['train_acc'].append(train_acc)
                history['val_loss'].append(val_loss)
                history['val_acc'].append(val_acc)
                
                # Log metrics
                mlflow.log_metrics({
                    'train_loss': train_loss,
                    'train_acc': train_acc,
                    'val_loss': val_loss,
                    'val_acc': val_acc,
                    'learning_rate': optimizer.param_groups[0]['lr']
                }, step=epoch)
                
                # Save best model
                if val_acc > best_val_acc:
                    best_val_acc = val_acc
                    best_model_state = self.model.state_dict().copy()
                    
                    # Save model checkpoint
                    checkpoint_path = self.config.output_dir / f'tomato_model_epoch_{epoch+1}.pth'
                    torch.save({
                        'epoch': epoch,
                        'model_state_dict': self.model.state_dict(),
                        'optimizer_state_dict': optimizer.state_dict(),
                        'val_acc': val_acc,
                        'class_names': self.class_names
                    }, checkpoint_path)
                    
                    mlflow.log_artifact(str(checkpoint_path))
                
                logger.info(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
                logger.info(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
                logger.info(f"Best Val Acc: {best_val_acc:.2f}%")
            
            # Save final model
            final_model_path = self.config.output_dir / 'tomato_model_best.pth'
            torch.save({
                'model_state_dict': best_model_state,
                'class_names': self.class_names,
                'val_acc': best_val_acc,
                'config': self.config
            }, final_model_path)
            
            mlflow.log_artifact(str(final_model_path))
            
            # Log final metrics
            mlflow.log_metrics({
                'final_train_acc': history['train_acc'][-1],
                'final_val_acc': history['val_acc'][-1],
                'best_val_acc': best_val_acc
            })
            
            logger.info(f"Training completed! Best validation accuracy: {best_val_acc:.2f}%")
            
            return history, best_val_acc

def main():
    """Main training function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Tomato Disease Classification Model')
    parser.add_argument('--dataset-path', type=str, default='../dataset', help='Path to dataset')
    parser.add_argument('--output-dir', type=str, default='models/tomato', help='Output directory for models')
    parser.add_argument('--model-name', type=str, default='efficientnet_b0', help='Model name')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--learning-rate', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--weight-decay', type=float, default=0.01, help='Weight decay')
    parser.add_argument('--num-workers', type=int, default=4, help='Number of workers')
    parser.add_argument('--mlflow-uri', type=str, default='http://localhost:5000', help='MLflow tracking URI')
    parser.add_argument('--experiment-name', type=str, default='tomato-disease-classification', help='MLflow experiment name')
    
    args = parser.parse_args()
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create config object
    class Config:
        def __init__(self, args):
            self.dataset_path = Path(args.dataset_path)
            self.output_dir = Path(args.output_dir)
            self.model_name = args.model_name
            self.batch_size = args.batch_size
            self.epochs = args.epochs
            self.learning_rate = args.learning_rate
            self.weight_decay = args.weight_decay
            self.num_workers = args.num_workers
            self.mlflow_uri = args.mlflow_uri
            self.experiment_name = args.experiment_name
    
    config = Config(args)
    
    # Initialize trainer
    trainer = TomatoDiseaseTrainer(config)
    
    # Prepare data
    trainer.prepare_data()
    
    # Train model
    history, best_acc = trainer.train()
    
    logger.info("Tomato disease classification training completed successfully!")

if __name__ == '__main__':
    main()
