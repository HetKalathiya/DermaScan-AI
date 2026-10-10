# DermaScan AI - Deep Learning Dermoscopy Assistant

DermaScan AI is a full-stack, leak-free deep learning dermoscopy pipeline and web application designed to predict skin cancer risk from dermatoscopic images using the HAM10000 dataset.

---

## Key Features
- **7-Class Fine-Grained Architecture with 3-Tier Clinical Marginalization:** The neural network is trained directly on the 7 distinct ISIC diagnostic classes (`akiec`, `bcc`, `bkl`, `df`, `mel`, `nv`, `vasc`), avoiding artificial decision boundary blurring between malignancies and benign look-alikes. At inference time, softmax probabilities are marginalized into 3 clinical risk tiers:
  - `Cancer` ($P(\text{mel}) + P(\text{bcc})$)
  - `Potential Cancer` ($P(\text{akiec})$)
  - `Not Cancer` ($P(\text{nv}) + P(\text{bkl}) + P(\text{df}) + P(\text{vasc})$)
- **Strict Leak-Free Splitting:** Groups dataset splits strictly by `lesion_id` to ensure no patient overlap between train and validation partitions.
- **Two-Stage Transfer Learning:** PyTorch EfficientNet-B3 with initial head warmup followed by backbone fine-tuning, 7-class balanced loss weighting, and Macro-F1 checkpointing.
- **Hardened Web App:** Modern, responsive Flask UI with genuine HTML5 drag-and-drop, clipboard paste support, Chart.js confidence visualizations, SSRF mitigation, and collision-free uploads.

---

## Project Structure
```text
├── dataset/                    # Generated train/val directories (7 class subfolders)
├── static/
│   ├── app.js                 # Drag-and-drop, clipboard paste, Chart.js logic
│   ├── styles.css             # Dark mode theme and responsive styling
│   └── uploads/               # Temporary user upload storage
├── templates/
│   └── index.html             # Web dashboard
├── prepare_dataset.py         # Leak-free dataset splitter grouped by lesion_id into 7 classes
├── train_model.py             # Two-stage 7-class training with balanced weights & Macro-F1 saving
├── evaluate_model.py          # Unified metrics: 7-class & 3-tier reports, confusion matrices, ROC/PR & proficiency curves
├── app.py                     # Secure Flask web server and 3-tier probability marginalization inference API
├── requirements.txt           # Python dependencies
└── best_model.pth             # Trained model weights checkpoint
```

---

## Getting Started

### 1. Requirements Installation
Ensure you have Python 3.9+ installed, then install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Dataset Preparation (Leak-Free 7 Classes)
Place `HAM10000_metadata.csv` and the image folders (`HAM10000_images_part_1`, `HAM10000_images_part_2`) in the project root, then run:
```bash
python prepare_dataset.py --val_size 0.20 --clean
```

### 3. Model Training
Train the 7-class EfficientNet-B3 model with 3-stage progressive transfer learning and balanced sampling:
```bash
python train_model.py --warmup_epochs 5 --finetune_epochs 8 --full_finetune_epochs 4 --batch_size 32
```
*The best checkpoint is automatically saved to `best_model.pth` based on peak validation Macro-F1 across all three phases.*

### 4. Comprehensive Model Evaluation
Generate the classification reports, confusion matrices, and all analytical graphs:
```bash
python evaluate_model.py --model_path best_model.pth
```
Outputs generated:
- `confusion_matrix.png`: Side-by-side 7-class diagnostic and collapsed 3-tier clinical confusion matrices.
- `model_accuracy_graph.png`: Per-class ROC and Precision-Recall curves.
- `model_proficiency_graph.png`: Per-class F1, Recall, Precision, confidence distributions, and per-class accuracy.

### 5. Running the Web Application
Start the Flask application:
```bash
python app.py
```
Open your browser at `http://localhost:5000`. You can drag-and-drop lesion images, paste directly from your clipboard (`Ctrl+V` / `⌘+V`), or choose a file to receive an immediate risk assessment.

---

## Medical Disclaimer
> **Important**: *This application is strictly for educational and research purposes.* It is not certified for clinical diagnostic use and must not replace evaluation by a qualified medical professional or certified dermatologist.
