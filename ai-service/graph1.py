import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
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

    if not os.path.exists(os.path.join(data_dir, 'val')):
        print("Validation dataset not found. Cannot evaluate.")
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
    all_preds = []
    all_labels = []

    print("Evaluating model to generate proficiency graphs...")
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs = inputs.to(device)

            outputs = model(inputs)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            _, preds = torch.max(probs, 1)

            all_probs.extend(probs.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    all_probs = np.array(all_probs)
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    # =============================================
    # FIGURE: 3 subplots in a row
    # =============================================
    fig, axes = plt.subplots(1, 3, figsize=(22, 7))

    colors_precision = '#4e79a7'
    colors_recall = '#f28e2b'
    colors_f1 = '#59a14f'

    # 1. Per-Class Metrics Bar Chart (Precision, Recall, F1)
    ax1 = axes[0]
    precision_per_class = precision_score(all_labels, all_preds, average=None, zero_division=0)
    recall_per_class = recall_score(all_labels, all_preds, average=None, zero_division=0)
    f1_per_class = f1_score(all_labels, all_preds, average=None, zero_division=0)

    x = np.arange(n_classes)
    bar_width = 0.25

    ax1.bar(x - bar_width, precision_per_class, bar_width, label='Precision', color=colors_precision)
    ax1.bar(x, recall_per_class, bar_width, label='Recall', color=colors_recall)
    ax1.bar(x + bar_width, f1_per_class, bar_width, label='F1-Score', color=colors_f1)

    macro_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    weighted_f1 = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
    ax1.axhline(y=macro_f1, color='purple', linestyle='--', linewidth=1.5, label=f'Macro F1 = {macro_f1:.2f}')

    ax1.set_xlabel('Class', fontsize=12)
    ax1.set_ylabel('Score', fontsize=12)
    ax1.set_title('Per-Class Precision, Recall & F1-Score', fontsize=13, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(class_names, rotation=20, ha='right', fontsize=10)
    ax1.set_ylim(0, 1.2)
    ax1.legend(loc='upper right', fontsize=10)
    ax1.grid(axis='y', alpha=0.3)

    # 2. Confidence Distribution (Correct vs Incorrect)
    ax2 = axes[1]
    max_probs = np.max(all_probs, axis=1)
    correct_mask = (all_preds == all_labels)
    conf_correct = max_probs[correct_mask]
    conf_incorrect = max_probs[~correct_mask]

    bins = np.linspace(0, 1, 21)
    ax2.hist(conf_correct, bins=bins, alpha=0.7, label=f'Correct (n={len(conf_correct)})',
             color='#2ca02c', edgecolor='white', linewidth=0.5)
    ax2.hist(conf_incorrect, bins=bins, alpha=0.7, label=f'Incorrect (n={len(conf_incorrect)})',
             color='#d62728', edgecolor='white', linewidth=0.5)

    mean_correct = np.mean(conf_correct) if len(conf_correct) > 0 else 0
    mean_incorrect = np.mean(conf_incorrect) if len(conf_incorrect) > 0 else 0
    ax2.axvline(x=mean_correct, color='#1b6e1b', linestyle='--', linewidth=1.5,
                label=f'Mean Correct: {mean_correct:.2f}')
    ax2.axvline(x=mean_incorrect, color='#8b0000', linestyle='--', linewidth=1.5,
                label=f'Mean Incorrect: {mean_incorrect:.2f}')

    ax2.set_xlabel('Prediction Confidence (Max Probability)', fontsize=12)
    ax2.set_ylabel('Number of Samples', fontsize=12)
    ax2.set_title('Confidence Distribution (Correct vs Incorrect)', fontsize=13, fontweight='bold')
    ax2.legend(loc='upper left', fontsize=10)
    ax2.grid(axis='y', alpha=0.3)

    # 3. Per-Class Accuracy
    ax3 = axes[2]
    class_accs = []
    class_counts = []
    for i in range(n_classes):
        mask = (all_labels == i)
        count = mask.sum()
        class_counts.append(count)
        if count > 0:
            acc = (all_preds[mask] == i).mean()
        else:
            acc = 0.0
        class_accs.append(acc)

    bar_colors = ['#2ca02c' if a >= 0.8 else '#f28e2b' if a >= 0.6 else '#d62728' for a in class_accs]
    bars = ax3.bar(x, class_accs, width=0.5, color=bar_colors, edgecolor='white', linewidth=0.5)

    for i, bar in enumerate(bars):
        height = bar.get_height()
        ax3.annotate(f'{height:.1%}\n(n={class_counts[i]})',
                     xy=(bar.get_x() + bar.get_width() / 2, height),
                     xytext=(0, 4), textcoords="offset points",
                     ha='center', va='bottom', fontsize=8, fontweight='bold')

    overall_accuracy = (all_preds == all_labels).mean()
    ax3.axhline(y=overall_accuracy, color='navy', linestyle='--', linewidth=1.5)
    ax3.set_xlabel('Class', fontsize=12)
    ax3.set_ylabel('Accuracy', fontsize=12)
    ax3.set_title('Per-Class Accuracy Breakdown', fontsize=13, fontweight='bold')
    ax3.set_xticks(x)
    ax3.set_xticklabels(class_names, rotation=20, ha='right', fontsize=10)
    ax3.set_ylim(0, 1.25)
    ax3.grid(axis='y', alpha=0.3)

    # Save
    plt.tight_layout()
    output_img = 'model_proficiency_graph.png'
    plt.savefig(output_img, dpi=300, bbox_inches='tight')
    print(f"\nSuccessfully generated model proficiency graphs!")
    print(f"Saved to: {output_img}")

if __name__ == '__main__':
    main()
