import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import roc_curve, auc, precision_recall_curve, average_precision_score
import matplotlib.pyplot as plt
import numpy as np

def main():
    # --- Configuration ---
    data_dir = 'dataset'
    batch_size = 32
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_path = 'best_model.pth'
    
    print(f"Using device: {device}")
    
    # --- Data Loading ---
    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Check if dataset exists
    if not os.path.exists(os.path.join(data_dir, 'val')):
        print("Validation dataset not found. Cannot evaluate accuracy.")
        return

    val_dataset = datasets.ImageFolder(os.path.join(data_dir, 'val'), transform=val_transforms)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    
    class_names = val_dataset.classes
    n_classes = len(class_names)
    print(f"Classes: {class_names}")
    
    # --- Load Model ---
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found.")
        return
        
    checkpoint = torch.load(model_path, map_location=device)
    saved_classes = checkpoint.get('class_names', class_names)
    n_classes_model = len(saved_classes)

    weights = models.EfficientNet_B3_Weights.DEFAULT
    model = models.efficientnet_b3(weights=weights)
    
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, n_classes_model)
    )
    
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()
    
    # --- Evaluation ---
    all_probs = []
    all_labels = []
    
    print("Evaluating model to generate accuracy graphs (this may take a minute)...")
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs = inputs.to(device)
            
            outputs = model(inputs)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            
            all_probs.extend(probs.cpu().numpy())
            all_labels.extend(labels.numpy())

    all_probs = np.array(all_probs)
    all_labels = np.array(all_labels)

    # --- Plotting Line Graphs (ROC & PR Curves) ---
    plt.figure(figsize=(15, 6))
    colors = ['#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6610f2', '#fd7e14', '#20c997']

    # 1. Plot ROC Curve (Receiver Operating Characteristic)
    plt.subplot(1, 2, 1)
    for i in range(n_classes):
        binary_labels = (all_labels == i).astype(int)
        class_probs = all_probs[:, i]
        
        if binary_labels.sum() > 0:
            fpr, tpr, _ = roc_curve(binary_labels, class_probs)
            roc_auc = auc(fpr, tpr)
            color = colors[i % len(colors)]
            plt.plot(fpr, tpr, color=color, lw=2, label=f'{class_names[i]} (AUC = {roc_auc:.2f})')

    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate (Sensitivity)')
    plt.title('ROC Curves by Class')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)

    # 2. Plot Precision-Recall Curve
    plt.subplot(1, 2, 2)
    for i in range(n_classes):
        binary_labels = (all_labels == i).astype(int)
        class_probs = all_probs[:, i]
        
        if binary_labels.sum() > 0:
            precision, recall, _ = precision_recall_curve(binary_labels, class_probs)
            ap = average_precision_score(binary_labels, class_probs)
            color = colors[i % len(colors)]
            plt.plot(recall, precision, color=color, lw=2, label=f'{class_names[i]} (AP = {ap:.2f})')

    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curves by Class')
    plt.legend(loc="lower left")
    plt.grid(alpha=0.3)

    # Save and show
    plt.tight_layout()
    output_img = 'model_accuracy_graph.png'
    plt.savefig(output_img, dpi=300)
    print(f"\nSuccessfully generated detailed accuracy line graphs!")
    print(f"Saved to: {output_img}")

if __name__ == '__main__':
    main()
