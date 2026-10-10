# Dataset Preparation, Augmentation & Training Pipeline Summary

A comprehensive overview of how the dataset is partitioned without data leakage, augmented, and trained using a **7-class fine-grained diagnostic classifier** with **3-tier clinical probability marginalization** in **DermaScan AI**.

---

## 1. Dataset Splitting & 7-Class Organization (`prepare_dataset.py`)

* **7 Fine-Grained ISIC/HAM10000 Diagnostic Classes:**
  Instead of forcing the network to merge visually distinct malignancies and benign look-alikes into coarse groups during optimization, the classifier is trained directly on all 7 fine-grained ISIC labels:
  1. `mel`: Melanoma (Malignant)
  2. `bcc`: Basal cell carcinoma (Malignant)
  3. `akiec`: Actinic keratoses and intraepithelial carcinoma / Bowen's disease (Pre-malignant)
  4. `bkl`: Benign keratosis-like lesions (Benign)
  5. `nv`: Melanocytic nevi (Benign)
  6. `df`: Dermatofibroma (Benign)
  7. `vasc`: Vascular lesions (Benign)

* **Strict Leak-Free Group Splitting:**
  * **The Challenge:** Medical dermoscopy datasets often include multiple images of the same lesion or patient taken at different angles, dates, or magnifications. A standard random split would place identical lesion features in both train and validation sets, causing artificial overestimation of model accuracy.
  * **The Solution:** Splitting is performed using `scikit-learn`'s `GroupShuffleSplit` grouped strictly by `lesion_id` with an **80% train / 20% validation** split (`random_state=42`).
  * **Zero Leakage Verification:** An automated assertion validates that the intersection of training lesions and validation lesions is strictly empty ($\text{overlap} = 0$).

* **Directory Structure Setup:**
  Images from `HAM10000_images_part_1` and `HAM10000_images_part_2` are mapped and organized into PyTorch `ImageFolder` standard structure across all 7 classes:
  ```text
  dataset/
  ├── train/
  │   ├── akiec/
  │   ├── bcc/
  │   ├── bkl/
  │   ├── df/
  │   ├── mel/
  │   ├── nv/
  │   └── vasc/
  └── val/
      ├── akiec/
      ├── bcc/
      ├── bkl/
      ├── df/
      ├── mel/
      ├── nv/
      └── vasc/
  ```

---

## 2. Data Augmentation & Preprocessing Pipeline (`train_model.py`)

* **Standard Input Resolution & Normalization:**
  * All input images are resized to **$224 \times 224$ pixels** (`transforms.Resize((224, 224))`).
  * Converted to tensors and normalized using ImageNet channel statistics ($\text{Mean} = [0.485, 0.456, 0.406]$, $\text{Std} = [0.229, 0.224, 0.225]$).

* **On-The-Fly Training Data Augmentations:**
  To reduce overfitting on under-represented classes and enhance generalization across varied clinical imaging conditions, the training pipeline applies:
  * **Spatial Invariance:**
    * `transforms.RandomHorizontalFlip()`: Random horizontal reflection.
    * `transforms.RandomVerticalFlip()`: Random vertical reflection.
    * `transforms.RandomRotation(degrees=20)`: Rotations within $\pm 20^\circ$ to simulate arbitrary camera/dermatoscope orientation.
  * **Color & Exposure Robustness:**
    * `transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1)`: Simulates variations in dermatoscope lighting, exposure, and diverse patient skin tones.

* **Validation Preprocessing:**
  * Validation transforms are kept **purely deterministic** (only resizing to $224 \times 224$ and ImageNet normalization) to evaluate generalization performance without synthetic distortions.

---

## 3. Model Architecture & Training Strategy (`train_model.py`)

* **Backbone & Custom Classifier Head:**
  * Backbone: Pretrained **EfficientNet-B3** (`torchvision.models.efficientnet_b3(weights=DEFAULT)`).
  * Replaced the final classifier layer with:
    * `nn.Dropout(p=0.3)` for regularization.
    * `nn.Linear(in_features=num_features, out_features=7)` matching the 7 diagnostic classes.

* **Balanced Batch Exposure via `WeightedRandomSampler`:**
  * To prevent common classes (`nv`) from starving minority malignancies of gradient updates, training batches are formed using PyTorch's `WeightedRandomSampler` with sampling weights proportional to $1 / N_{\text{class}}$.
  * Every batch receives balanced representation across all 7 diagnostic classes ($\approx 4\text{–}5$ images per class).
  * Coupled with real-time data augmentations, minority lesion images are seen in unique random geometric/color orientations across epochs.
  * Standard unweighted `nn.CrossEntropyLoss()` is utilized alongside the sampler to prevent double-weighting distortion and avoid artificial false positives on dominant classes.

* **Three-Stage Progressive Transfer Learning:**
  * **Phase 1: Classifier Warmup (5 Epochs):**
    * Feature extraction backbone layers are frozen (`param.requires_grad = False`).
    * Only the newly initialized 7-class linear head is trained using `Adam(lr=1e-3)` to stabilize top-layer weights.
  * **Phase 2: Top-Block Fine-Tuning (8 Epochs):**
    * Top 3 feature blocks of EfficientNet (`model.features[-3:]`) are unfrozen for semantic domain adaptation.
    * Discriminative learning rates: `1e-4` for backbone features and `5e-4` for the classifier head.
  * **Phase 3: Full-Backbone Progressive Fine-Tuning (4 Epochs):**
    * All layers across the entire EfficientNet backbone (`model.features.parameters()`) are unfrozen to adapt low/mid-level dermoscopic texture and color filters.
    * Gentle learning rate: `1e-5` for the backbone and `5e-5` for the head (prevents catastrophic forgetting of ImageNet representations).
    * Dynamic learning rate scheduling via `ReduceLROnPlateau(mode='max', patience=1, factor=0.5)` monitoring validation Macro-F1.

* **Checkpointing Metric:**
  * Optimized and saved the best checkpoint (`best_model.pth`) based on peak **Validation Macro-F1 score** across all 7 diagnostic classes throughout all three phases.

---

## 4. 3-Tier Clinical Probability Marginalization (`app.py` & `evaluate_model.py`)

At inference time, the 7 fine-grained class probabilities $P(\text{dx}_i \mid x)$ are converted to the 3 clinical risk tiers by summing their mutually exclusive softmax probabilities:

$$\begin{aligned}
P(\text{Cancer}) &= P(\text{mel}) + P(\text{bcc}) \\
P(\text{Potential Cancer}) &= P(\text{akiec}) \\
P(\text{Not Cancer}) &= P(\text{nv}) + P(\text{bkl}) + P(\text{df}) + P(\text{vasc})
\end{aligned}$$

* **Clinical Actionability:** The web dashboard and triage referral system remain intuitive and color-coded (`Cancer`, `Potential Cancer`, `Not Cancer`), while the underlying deep neural network benefits from sharper, uncompromised decision boundaries.

---

## 5. Clinical Safety Decision Thresholding

In high-stakes oncology triage, a False Negative (missing a malignant lesion) carries vastly higher clinical risk than a False Positive. Rather than relying on naive symmetric $\text{argmax}$, the system applies a **hierarchical safety operating point**:

$$\text{Triage Output} = \begin{cases} 
\textbf{Cancer} & \text{if } P(\text{Cancer}) \ge \theta_{\text{cancer}} \quad (\text{default: } 0.28) \\
\textbf{Potential Cancer} & \text{else if } P(\text{Cancer}) + P(\text{Potential Cancer}) \ge \theta_{\text{potential}} \quad (\text{default: } 0.30) \\
\textbf{Not Cancer} & \text{otherwise}
\end{cases}$$

* **Operating Point Sweeping (`evaluate_model.py`):** Automatically evaluates sensitivity, specificity, precision, and exact missed cancer counts across operating points ($\theta \in [0.15, 0.50]$) to balance sensitivity and clinic biopsy burden.
* **Configurable:** Thresholds can be tuned via `--cancer_thresh` in evaluation or environment variables `CANCER_THRESHOLD` in production deployment.
