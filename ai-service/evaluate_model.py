import os
import argparse
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    precision_recall_curve,
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    balanced_accuracy_score
)

DX_TO_RISK = {
    'mel': 'Cancer',
    'bcc': 'Cancer',
    'akiec': 'Potential Cancer',
    'nv': 'Not Cancer',
    'bkl': 'Not Cancer',
    'df': 'Not Cancer',
    'vasc': 'Not Cancer'
}

RISK_TIERS = ['Cancer', 'Potential Cancer', 'Not Cancer']

def classify_with_thresholds(clinical_probs, cancer_thresh=0.28, potential_thresh=0.30):
    """
    Hierarchical Clinical Triage Decision Rule:
    1. If P(Cancer) >= cancer_thresh -> 'Cancer'
    2. Else if P(Cancer) + P(Potential Cancer) >= potential_thresh -> 'Potential Cancer'
    3. Else -> 'Not Cancer'
    """
    p_cancer = clinical_probs[:, 0]
    p_potential = clinical_probs[:, 1]
    
    pred_tiers = []
    for i in range(len(clinical_probs)):
        if p_cancer[i] >= cancer_thresh:
            pred_tiers.append('Cancer')
        elif (p_cancer[i] + p_potential[i]) >= potential_thresh:
            pred_tiers.append('Potential Cancer')
        else:
            pred_tiers.append('Not Cancer')
            
    return np.array(pred_tiers)

def evaluate(model_path='best_model.pth', data_dir='dataset', split='val', batch_size=32, 
             cancer_thresh=0.28, potential_thresh=0.30, output_dir='.'):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    eval_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    split_dir = os.path.join(data_dir, split)
    if not os.path.exists(split_dir):
        raise FileNotFoundError(f"Evaluation directory not found: '{split_dir}'. Run prepare_dataset.py first.")

    dataset = datasets.ImageFolder(split_dir, transform=eval_transforms)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=(device.type == 'cuda'))

    class_names = dataset.classes
    n_classes = len(class_names)
    print(f"Classes ({n_classes}): {class_names}")

    # Load Model
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model checkpoint '{model_path}' not found. Train the model first.")

    checkpoint = torch.load(model_path, map_location=device)
    saved_classes = checkpoint.get('class_names', class_names)
    num_checkpoint_classes = len(saved_classes)

    weights = models.EfficientNet_B3_Weights.DEFAULT
    model = models.efficientnet_b3(weights=weights)
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, num_checkpoint_classes)
    )

    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()

    all_probs = []
    all_preds = []
    all_labels = []

    print(f"\nRunning evaluation on '{split}' set ({len(dataset)} samples)...")
    with torch.no_grad():
        for inputs, labels in dataloader:
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

    # --- 1. Diagnostic Classification Report (7 Classes) ---
    print("\n" + "="*65)
    print("FINE-GRAINED DIAGNOSTIC CLASSIFICATION REPORT (7 Classes)")
    print("="*65)
    print(classification_report(all_labels, all_preds, target_names=class_names, digits=4))

    macro_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    weighted_f1 = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
    balanced_acc = balanced_accuracy_score(all_labels, all_preds)
    overall_acc = (all_preds == all_labels).mean()

    print(f"Overall Accuracy:       {overall_acc:.2%}")
    print(f"Balanced Accuracy:      {balanced_acc:.2%}")
    print(f"Macro F1-Score:         {macro_f1:.4f}")
    print(f"Weighted F1-Score:      {weighted_f1:.4f}")

    # --- 2. Collapsed 3-Tier Clinical Risk Report ---
    is_7_class_ham = set(class_names).issubset(set(DX_TO_RISK.keys()))
    if is_7_class_ham:
        class_to_idx = {name: i for i, name in enumerate(class_names)}
        
        # True clinical tiers
        true_tiers = np.array([DX_TO_RISK[class_names[lbl]] for lbl in all_labels])
        
        # Marginalized clinical probabilities: [Cancer, Potential Cancer, Not Cancer]
        clinical_probs = np.zeros((len(all_labels), len(RISK_TIERS)))
        for t_idx, tier in enumerate(RISK_TIERS):
            member_classes = [c for c, r in DX_TO_RISK.items() if r == tier and c in class_to_idx]
            member_indices = [class_to_idx[c] for c in member_classes]
            clinical_probs[:, t_idx] = all_probs[:, member_indices].sum(axis=1)

        # --- Operating Point Sweep for Cancer Decision Threshold ---
        print("\n" + "="*65)
        print("CLINICAL CANCER THRESHOLD SWEEP (Operating Points)")
        print("="*65)
        print(f"{'Threshold':<10} | {'Sensitivity (Recall)':<22} | {'Precision':<10} | {'Missed Cancers':<15} | {'Specificity':<12}")
        print("-" * 65)

        is_true_cancer = (true_tiers == 'Cancer')
        total_real_cancers = is_true_cancer.sum()

        sweep_thresholds = [0.15, 0.20, 0.25, 0.28, 0.30, 0.35, 0.40, 0.50]
        for th in sweep_thresholds:
            pred_cancer = (clinical_probs[:, 0] >= th)
            tp = (pred_cancer & is_true_cancer).sum()
            fp = (pred_cancer & ~is_true_cancer).sum()
            fn = (~pred_cancer & is_true_cancer).sum()
            tn = (~pred_cancer & ~is_true_cancer).sum()

            sens = tp / (tp + fn) if (tp + fn) > 0 else 0
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0

            marker = " <-- [Active]" if th == cancer_thresh else ""
            print(f"{th:<10.2f} | {sens:<22.2%} | {prec:<10.2%} | {fn:<15d} | {spec:<12.2%}{marker}")

        # Apply active clinical threshold policy
        pred_tiers = classify_with_thresholds(clinical_probs, cancer_thresh=cancer_thresh, potential_thresh=potential_thresh)

        print("\n" + "="*65)
        print(f"COLLAPSED 3-TIER CLINICAL REPORT (Cancer Thresh: {cancer_thresh:.2f}, Potential Thresh: {potential_thresh:.2f})")
        print("="*65)
        print(classification_report(true_tiers, pred_tiers, target_names=RISK_TIERS, digits=4))

        tier_acc = (pred_tiers == true_tiers).mean()
        tier_macro_f1 = f1_score(true_tiers, pred_tiers, average='macro', zero_division=0)
        cancer_fn = ((true_tiers == 'Cancer') & (pred_tiers != 'Cancer')).sum()
        print(f"Clinical Tier Accuracy:    {tier_acc:.2%}")
        print(f"Clinical Tier Macro-F1:    {tier_macro_f1:.4f}")
        print(f"Total Missed Cancer Cases: {cancer_fn} / {total_real_cancers} ({cancer_fn/total_real_cancers:.1%})")

    # --- 3. Confusion Matrix (Side-by-Side Plot) ---
    if is_7_class_ham:
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))

        # Diagnostic CM
        cm_diag = confusion_matrix(all_labels, all_preds)
        sns.heatmap(cm_diag, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names, ax=axes[0])
        axes[0].set_title('7-Class Diagnostic Confusion Matrix', fontsize=12, fontweight='bold')
        axes[0].set_ylabel('True Diagnosis')
        axes[0].set_xlabel('Predicted Diagnosis')

        # Clinical Tier CM
        tier_to_idx = {t: i for i, t in enumerate(RISK_TIERS)}
        y_true_tier_idx = np.array([tier_to_idx[t] for t in true_tiers])
        y_pred_tier_idx = np.array([tier_to_idx[t] for t in pred_tiers])
        cm_clinical = confusion_matrix(y_true_tier_idx, y_pred_tier_idx)
        sns.heatmap(cm_clinical, annot=True, fmt='d', cmap='Reds', xticklabels=RISK_TIERS, yticklabels=RISK_TIERS, ax=axes[1])
        axes[1].set_title(f'3-Tier Clinical Confusion Matrix (\u03b8_cancer={cancer_thresh:.2f})', fontsize=12, fontweight='bold')
        axes[1].set_ylabel('True Clinical Risk')
        axes[1].set_xlabel('Predicted Clinical Risk')

        plt.tight_layout()
        cm_path = os.path.join(output_dir, 'confusion_matrix.png')
        plt.savefig(cm_path, dpi=300)
        plt.close()
        print(f"\nSaved: {cm_path}")
    else:
        cm = confusion_matrix(all_labels, all_preds)
        plt.figure(figsize=(7, 5.5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix', fontsize=13, fontweight='bold')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        cm_path = os.path.join(output_dir, 'confusion_matrix.png')
        plt.savefig(cm_path, dpi=300)
        plt.close()
        print(f"\nSaved: {cm_path}")

    # --- 4. ROC & Precision-Recall Curves ---
    plt.figure(figsize=(15, 6))
    colors = ['#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6610f2', '#fd7e14', '#20c997']

    # ROC Subplot
    plt.subplot(1, 2, 1)
    for i in range(n_classes):
        bin_labels = (all_labels == i).astype(int)
        c_probs = all_probs[:, i]
        if bin_labels.sum() > 0:
            fpr, tpr, _ = roc_curve(bin_labels, c_probs)
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, color=colors[i % len(colors)], lw=2, label=f'{class_names[i]} (AUC = {roc_auc:.2f})')

    plt.plot([0, 1], [0, 1], color='gray', lw=1.5, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=11)
    plt.ylabel('True Positive Rate (Sensitivity)', fontsize=11)
    plt.title('ROC Curves by Diagnostic Class', fontsize=12, fontweight='bold')
    plt.legend(loc="lower right", fontsize=9)
    plt.grid(alpha=0.3)

    # PR Subplot
    plt.subplot(1, 2, 2)
    for i in range(n_classes):
        bin_labels = (all_labels == i).astype(int)
        c_probs = all_probs[:, i]
        if bin_labels.sum() > 0:
            prec, rec, _ = precision_recall_curve(bin_labels, c_probs)
            ap = average_precision_score(bin_labels, c_probs)
            plt.plot(rec, prec, color=colors[i % len(colors)], lw=2, label=f'{class_names[i]} (AP = {ap:.2f})')

    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Recall', fontsize=11)
    plt.ylabel('Precision', fontsize=11)
    plt.title('Precision-Recall Curves by Diagnostic Class', fontsize=12, fontweight='bold')
    plt.legend(loc="lower left", fontsize=9)
    plt.grid(alpha=0.3)

    plt.tight_layout()
    roc_pr_path = os.path.join(output_dir, 'model_accuracy_graph.png')
    plt.savefig(roc_pr_path, dpi=300)
    plt.close()
    print(f"Saved: {roc_pr_path}")

    # --- 5. Proficiency & Confidence Metrics ---
    fig, axes = plt.subplots(1, 3, figsize=(20, 6))

    # Per-Class Precision, Recall, F1
    ax1 = axes[0]
    p_scores = precision_score(all_labels, all_preds, average=None, zero_division=0)
    r_scores = recall_score(all_labels, all_preds, average=None, zero_division=0)
    f_scores = f1_score(all_labels, all_preds, average=None, zero_division=0)

    x = np.arange(n_classes)
    w = 0.25
    ax1.bar(x - w, p_scores, w, label='Precision', color='#4e79a7')
    ax1.bar(x, r_scores, w, label='Recall', color='#f28e2b')
    ax1.bar(x + w, f_scores, w, label='F1-Score', color='#59a14f')

    ax1.set_title('Per-Class Precision, Recall & F1-Score', fontsize=11, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(class_names, rotation=20, ha='right')
    ax1.set_ylim(0, 1.15)
    ax1.axhline(y=macro_f1, color='purple', linestyle='--', label=f'Macro F1: {macro_f1:.2f}')
    ax1.legend(fontsize=9)
    ax1.grid(axis='y', alpha=0.3)

    # Confidence Distribution (Correct vs Incorrect)
    ax2 = axes[1]
    max_probs = np.max(all_probs, axis=1)
    correct = (all_preds == all_labels)
    c_conf = max_probs[correct]
    i_conf = max_probs[~correct]

    bins = np.linspace(0, 1, 20)
    ax2.hist(c_conf, bins=bins, alpha=0.7, label=f'Correct (n={len(c_conf)})', color='#2ca02c')
    ax2.hist(i_conf, bins=bins, alpha=0.7, label=f'Incorrect (n={len(i_conf)})', color='#d62728')
    ax2.set_xlabel('Prediction Confidence')
    ax2.set_ylabel('Count')
    ax2.set_title('Confidence: Correct vs Incorrect', fontsize=11, fontweight='bold')
    ax2.legend(fontsize=9)
    ax2.grid(axis='y', alpha=0.3)

    # Per-Class Accuracy
    ax3 = axes[2]
    class_accs = [((all_preds[all_labels == i] == i).mean() if (all_labels == i).sum() > 0 else 0) for i in range(n_classes)]
    bars = ax3.bar(x, class_accs, color=['#2ca02c' if a >= 0.8 else '#f28e2b' if a >= 0.6 else '#d62728' for a in class_accs], width=0.5)
    for i, b in enumerate(bars):
        count = (all_labels == i).sum()
        ax3.annotate(f'{class_accs[i]:.1%}\n(n={count})', xy=(b.get_x() + b.get_width() / 2, b.get_height()), xytext=(0, 4), textcoords="offset points", ha='center', fontweight='bold', fontsize=8)

    ax3.set_title('Per-Class Accuracy Breakdown', fontsize=11, fontweight='bold')
    ax3.set_xticks(x)
    ax3.set_xticklabels(class_names, rotation=20, ha='right')
    ax3.set_ylim(0, 1.25)
    ax3.axhline(y=overall_acc, color='navy', linestyle='--', label=f'Overall: {overall_acc:.1%}')
    ax3.legend(fontsize=9)
    ax3.grid(axis='y', alpha=0.3)

    plt.tight_layout()
    prof_path = os.path.join(output_dir, 'model_proficiency_graph.png')
    plt.savefig(prof_path, dpi=300)
    plt.close()
    print(f"Saved: {prof_path}")

    print("\nEvaluation complete! All reports and figures generated successfully.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Evaluate Skin Cancer Classification Model & Generate Visual Analytics")
    parser.add_argument('--model_path', default='best_model.pth', help='Path to trained checkpoint')
    parser.add_argument('--data_dir', default='dataset', help='Dataset root folder')
    parser.add_argument('--split', default='val', help='Dataset split to evaluate (e.g. val or test)')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--cancer_thresh', type=float, default=0.28, help='Clinical operating threshold for Cancer triage')
    parser.add_argument('--potential_thresh', type=float, default=0.30, help='Clinical operating threshold for Potential Cancer triage')
    parser.add_argument('--output_dir', default='.', help='Output directory for generated plots')
    args = parser.parse_args()

    evaluate(
        model_path=args.model_path,
        data_dir=args.data_dir,
        split=args.split,
        batch_size=args.batch_size,
        cancer_thresh=args.cancer_thresh,
        potential_thresh=args.potential_thresh,
        output_dir=args.output_dir
    )
