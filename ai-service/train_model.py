import os
import time
import sys
import argparse
import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms, models
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import f1_score, balanced_accuracy_score

def format_time(seconds):
    mins, secs = divmod(int(seconds), 60)
    return f"{mins:02d}m {secs:02d}s"

def train_epoch(model, dataloader, criterion, optimizer, device, phase_name="Train"):
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    total_batches = len(dataloader)
    start_time = time.time()

    for batch_idx, (inputs, labels) in enumerate(dataloader, 1):
        inputs = inputs.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        with torch.set_grad_enabled(True):
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)
            loss.backward()
            optimizer.step()

        batch_loss = loss.item()
        running_loss += batch_loss * inputs.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

        # Progress update
        elapsed = time.time() - start_time
        speed = batch_idx / elapsed if elapsed > 0 else 0
        eta = (total_batches - batch_idx) / speed if speed > 0 else 0
        avg_so_far = running_loss / ((batch_idx - 1) * dataloader.batch_size + inputs.size(0))

        percent = int(100 * batch_idx / total_batches)
        bar_len = 25
        filled_len = int(bar_len * batch_idx // total_batches)
        bar = '=' * filled_len + '-' * (bar_len - filled_len)

        sys.stdout.write(
            f"\r  [{phase_name}] [{bar}] {batch_idx}/{total_batches} ({percent}%) | "
            f"Loss: {avg_so_far:.4f} | Speed: {speed:.1f} batch/s | ETA: {format_time(eta)}"
        )
        sys.stdout.flush()

    sys.stdout.write("\n")
    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    epoch_acc = (np.array(all_preds) == np.array(all_labels)).mean()
    return epoch_loss, epoch_f1, epoch_acc

def evaluate_epoch(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    total_batches = len(dataloader)

    with torch.no_grad():
        for batch_idx, (inputs, labels) in enumerate(dataloader, 1):
            inputs = inputs.to(device)
            labels = labels.to(device)

            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)

            running_loss += loss.item() * inputs.size(0)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

            sys.stdout.write(f"\r  [Validating] {batch_idx}/{total_batches} batches...")
            sys.stdout.flush()

    sys.stdout.write("\r" + " " * 50 + "\r")
    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    epoch_acc = (np.array(all_preds) == np.array(all_labels)).mean()
    epoch_balanced_acc = balanced_accuracy_score(all_labels, all_preds)
    return epoch_loss, epoch_f1, epoch_acc, epoch_balanced_acc

def main():
    parser = argparse.ArgumentParser(description="Train Skin Lesion Classifier with 3-Stage Progressive Transfer Learning & Macro-F1 Checkpointing")
    parser.add_argument('--data_dir', default='dataset', help='Dataset root directory containing train and val folders')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size for training')
    parser.add_argument('--warmup_epochs', type=int, default=5, help='Phase 1: Epochs to train only the classifier head')
    parser.add_argument('--finetune_epochs', type=int, default=8, help='Phase 2: Epochs to fine-tune top 3 backbone blocks')
    parser.add_argument('--full_finetune_epochs', type=int, default=4, help='Phase 3: Epochs to fine-tune entire backbone at low LR')
    parser.add_argument('--head_lr', type=float, default=1e-3, help='Phase 1 learning rate for classifier head')
    parser.add_argument('--backbone_lr', type=float, default=1e-4, help='Phase 2 learning rate for top backbone blocks')
    parser.add_argument('--full_backbone_lr', type=float, default=1e-5, help='Phase 3 learning rate for full backbone')
    parser.add_argument('--num_workers', type=int, default=0, help='DataLoader workers')
    parser.add_argument('--use_sampler', action='store_true', default=True, help='Use WeightedRandomSampler for balanced batch class exposure')
    parser.add_argument('--no_sampler', dest='use_sampler', action='store_false', help='Disable WeightedRandomSampler and rely on shuffle')
    parser.add_argument('--loss_weighting', choices=['none', 'balanced'], default=None, 
                        help="Loss weighting scheme ('none' or 'balanced'). Defaults to 'none' when sampler is active to avoid double-weighting.")
    parser.add_argument('--save_path', default='best_model.pth', help='Destination path for best checkpoint')
    args = parser.parse_args()

    # Set default loss weighting based on sampler status
    if args.loss_weighting is None:
        args.loss_weighting = 'none' if args.use_sampler else 'balanced'

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")
    if device.type == 'cpu':
        print("Note: Training on CPU. Batch progress bar is enabled to track estimated completion times.")

    # --- Data Transforms ---
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_path = os.path.join(args.data_dir, 'train')
    val_path = os.path.join(args.data_dir, 'val')

    if not os.path.exists(train_path) or not os.path.exists(val_path):
        raise FileNotFoundError(f"Train/Val directories not found under '{args.data_dir}'. Run prepare_dataset.py first.")

    train_dataset = datasets.ImageFolder(train_path, transform=train_transforms)
    val_dataset = datasets.ImageFolder(val_path, transform=val_transforms)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    train_targets = np.array(train_dataset.targets)
    class_counts = np.bincount(train_targets)

    print(f"\n--- Dataset Summary ({num_classes} Classes) ---")
    for idx, name in enumerate(class_names):
        print(f"  [{idx}] {name:<8} : {class_counts[idx]} train images")

    # --- Sampler & Loss Setup ---
    if args.use_sampler:
        print("\n[Sampling Strategy] WeightedRandomSampler enabled (inverse-frequency per-sample probability).")
        class_weights_sampling = 1.0 / class_counts
        sample_weights = class_weights_sampling[train_targets]
        sampler = WeightedRandomSampler(
            weights=torch.DoubleTensor(sample_weights),
            num_samples=len(sample_weights),
            replacement=True
        )
        train_loader = DataLoader(
            train_dataset,
            batch_size=args.batch_size,
            sampler=sampler,
            num_workers=args.num_workers,
            pin_memory=(device.type == 'cuda')
        )
    else:
        print("\n[Sampling Strategy] Standard random shuffle DataLoader.")
        train_loader = DataLoader(
            train_dataset,
            batch_size=args.batch_size,
            shuffle=True,
            num_workers=args.num_workers,
            pin_memory=(device.type == 'cuda')
        )

    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=(device.type == 'cuda')
    )

    # Loss criterion
    if args.loss_weighting == 'balanced':
        class_weights = compute_class_weight('balanced', classes=np.unique(train_targets), y=train_targets)
        class_weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)
        print(f"[Loss Strategy] CrossEntropyLoss with balanced class weights: {np.round(class_weights, 3)}")
        criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    else:
        print("[Loss Strategy] Standard unweighted CrossEntropyLoss (batch distribution balanced via sampler).")
        criterion = nn.CrossEntropyLoss()

    # --- Model Setup ---
    weights = models.EfficientNet_B3_Weights.DEFAULT
    model = models.efficientnet_b3(weights=weights)
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, num_classes)
    )
    model = model.to(device)

    best_val_f1 = 0.0
    history = {'train_loss': [], 'val_loss': [], 'train_f1': [], 'val_f1': [], 'val_acc': []}
    total_epochs = args.warmup_epochs + args.finetune_epochs + args.full_finetune_epochs
    current_epoch = 0

    # =========================================================================
    # PHASE 1: Classifier Head Warmup (Frozen Backbone)
    # =========================================================================
    if args.warmup_epochs > 0:
        print("\n" + "="*65)
        print(f"PHASE 1: Classifier Head Warmup ({args.warmup_epochs} Epochs, Frozen Backbone)")
        print("="*65)

        for param in model.features.parameters():
            param.requires_grad = False

        optimizer = optim.Adam(model.classifier.parameters(), lr=args.head_lr)

        for epoch in range(args.warmup_epochs):
            current_epoch += 1
            print(f"\nEpoch {current_epoch}/{total_epochs} [Phase 1: Warmup Head]")
            t_loss, t_f1, t_acc = train_epoch(model, train_loader, criterion, optimizer, device, phase_name="P1-Warmup")
            v_loss, v_f1, v_acc, v_bacc = evaluate_epoch(model, val_loader, criterion, device)

            history['train_loss'].append(t_loss)
            history['val_loss'].append(v_loss)
            history['train_f1'].append(t_f1)
            history['val_f1'].append(v_f1)
            history['val_acc'].append(v_acc)

            print(f"  Summary -> Train Loss: {t_loss:.4f} | Train F1: {t_f1:.4f} | Train Acc: {t_acc:.2%}")
            print(f"             Val Loss:   {v_loss:.4f} | Val F1:   {v_f1:.4f} | Val Acc:   {v_acc:.2%} | Val Balanced Acc: {v_bacc:.2%}")

            if v_f1 > best_val_f1:
                best_val_f1 = v_f1
                torch.save({
                    'model_state_dict': model.state_dict(),
                    'class_names': class_names,
                    'macro_f1': best_val_f1,
                    'epoch': current_epoch
                }, args.save_path)
                print(f"  --> Saved new best checkpoint to '{args.save_path}' (Val Macro-F1: {best_val_f1:.4f})")

    # =========================================================================
    # PHASE 2: Top-Block Fine-Tuning (Unfreeze Last 3 Blocks)
    # =========================================================================
    if args.finetune_epochs > 0:
        print("\n" + "="*65)
        print(f"PHASE 2: Top Backbone Blocks Fine-Tuning ({args.finetune_epochs} Epochs)")
        print("="*65)

        for param in model.features[:-3].parameters():
            param.requires_grad = False
        for param in model.features[-3:].parameters():
            param.requires_grad = True

        optimizer = optim.Adam([
            {'params': model.features[-3:].parameters(), 'lr': args.backbone_lr},
            {'params': model.classifier.parameters(), 'lr': args.head_lr * 0.5}
        ])
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', patience=2, factor=0.5)

        for epoch in range(args.finetune_epochs):
            current_epoch += 1
            print(f"\nEpoch {current_epoch}/{total_epochs} [Phase 2: Top 3 Blocks]")
            t_loss, t_f1, t_acc = train_epoch(model, train_loader, criterion, optimizer, device, phase_name="P2-TopBlocks")
            v_loss, v_f1, v_acc, v_bacc = evaluate_epoch(model, val_loader, criterion, device)

            scheduler.step(v_f1)

            history['train_loss'].append(t_loss)
            history['val_loss'].append(v_loss)
            history['train_f1'].append(t_f1)
            history['val_f1'].append(v_f1)
            history['val_acc'].append(v_acc)

            print(f"  Summary -> Train Loss: {t_loss:.4f} | Train F1: {t_f1:.4f} | Train Acc: {t_acc:.2%}")
            print(f"             Val Loss:   {v_loss:.4f} | Val F1:   {v_f1:.4f} | Val Acc:   {v_acc:.2%} | Val Balanced Acc: {v_bacc:.2%}")

            if v_f1 > best_val_f1:
                best_val_f1 = v_f1
                torch.save({
                    'model_state_dict': model.state_dict(),
                    'class_names': class_names,
                    'macro_f1': best_val_f1,
                    'epoch': current_epoch
                }, args.save_path)
                print(f"  --> Saved new best checkpoint to '{args.save_path}' (Val Macro-F1: {best_val_f1:.4f})")

    # =========================================================================
    # PHASE 3: Full-Backbone Progressive Fine-Tuning (All Layers at Gentle LR)
    # =========================================================================
    if args.full_finetune_epochs > 0:
        print("\n" + "="*65)
        print(f"PHASE 3: Full-Backbone Progressive Fine-Tuning ({args.full_finetune_epochs} Epochs, Gentle LR: {args.full_backbone_lr})")
        print("="*65)

        # Unfreeze all layers in the feature backbone
        for param in model.features.parameters():
            param.requires_grad = True

        optimizer = optim.Adam([
            {'params': model.features.parameters(), 'lr': args.full_backbone_lr},
            {'params': model.classifier.parameters(), 'lr': args.full_backbone_lr * 5}
        ])
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', patience=1, factor=0.5)

        for epoch in range(args.full_finetune_epochs):
            current_epoch += 1
            print(f"\nEpoch {current_epoch}/{total_epochs} [Phase 3: Full Backbone]")
            t_loss, t_f1, t_acc = train_epoch(model, train_loader, criterion, optimizer, device, phase_name="P3-FullBackbone")
            v_loss, v_f1, v_acc, v_bacc = evaluate_epoch(model, val_loader, criterion, device)

            scheduler.step(v_f1)

            history['train_loss'].append(t_loss)
            history['val_loss'].append(v_loss)
            history['train_f1'].append(t_f1)
            history['val_f1'].append(v_f1)
            history['val_acc'].append(v_acc)

            print(f"  Summary -> Train Loss: {t_loss:.4f} | Train F1: {t_f1:.4f} | Train Acc: {t_acc:.2%}")
            print(f"             Val Loss:   {v_loss:.4f} | Val F1:   {v_f1:.4f} | Val Acc:   {v_acc:.2%} | Val Balanced Acc: {v_bacc:.2%}")

            if v_f1 > best_val_f1:
                best_val_f1 = v_f1
                torch.save({
                    'model_state_dict': model.state_dict(),
                    'class_names': class_names,
                    'macro_f1': best_val_f1,
                    'epoch': current_epoch
                }, args.save_path)
                print(f"  --> Saved new best checkpoint to '{args.save_path}' (Val Macro-F1: {best_val_f1:.4f})")

    print(f"\nTraining Complete! Peak Validation Macro-F1: {best_val_f1:.4f}")
    print(f"Best model weights saved to: {args.save_path}")

    # --- Plot Training Curves ---
    plt.figure(figsize=(13, 5))
    plt.subplot(1, 2, 1)
    plt.plot(history['train_loss'], label='Train Loss', color='#dc3545', lw=2)
    plt.plot(history['val_loss'], label='Val Loss', color='#007bff', lw=2)
    
    # Add phase boundary vertical lines if applicable
    p1_end = args.warmup_epochs
    p2_end = args.warmup_epochs + args.finetune_epochs
    if p1_end > 0 and p1_end < total_epochs:
        plt.axvline(x=p1_end - 0.5, color='gray', linestyle=':', label='P1/P2 boundary')
    if p2_end > 0 and p2_end < total_epochs:
        plt.axvline(x=p2_end - 0.5, color='purple', linestyle=':', label='P2/P3 boundary')

    plt.title('Loss History Across 3 Phases', fontsize=12, fontweight='bold')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(alpha=0.3)

    plt.subplot(1, 2, 2)
    plt.plot(history['train_f1'], label='Train Macro-F1', color='#28a745', lw=2)
    plt.plot(history['val_f1'], label='Val Macro-F1', color='#17a2b8', lw=2)
    if p1_end > 0 and p1_end < total_epochs:
        plt.axvline(x=p1_end - 0.5, color='gray', linestyle=':')
    if p2_end > 0 and p2_end < total_epochs:
        plt.axvline(x=p2_end - 0.5, color='purple', linestyle=':')

    plt.title('Macro-F1 Score History Across 3 Phases', fontsize=12, fontweight='bold')
    plt.xlabel('Epoch')
    plt.ylabel('Macro-F1')
    plt.legend()
    plt.grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig('training_curves.png', dpi=300)
    print("Saved training metrics plot to 'training_curves.png'")

if __name__ == '__main__':
    main()
