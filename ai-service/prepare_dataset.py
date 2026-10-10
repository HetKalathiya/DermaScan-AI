import os
import shutil
import argparse
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit

# 3-tier clinical risk mapping from HAM10000 diagnostic labels
DX_TO_RISK = {
    'mel': 'Cancer',            # Melanoma
    'bcc': 'Cancer',            # Basal cell carcinoma
    'akiec': 'Potential Cancer',# Actinic keratoses and intraepithelial carcinoma / Bowen's
    'nv': 'Not Cancer',         # Melanocytic nevi (benign)
    'bkl': 'Not Cancer',        # Benign keratosis-like lesions
    'df': 'Not Cancer',         # Dermatofibroma
    'vasc': 'Not Cancer'        # Vascular lesions
}

DX_FULL_NAMES = {
    'akiec': "Actinic keratoses & intraepithelial carcinoma",
    'bcc': "Basal cell carcinoma",
    'bkl': "Benign keratosis-like lesions",
    'df': "Dermatofibroma",
    'mel': "Melanoma",
    'nv': "Melanocytic nevi",
    'vasc': "Vascular lesions"
}

def locate_image(image_id, image_dirs):
    filename = f"{image_id}.jpg"
    for img_dir in image_dirs:
        candidate = os.path.join(img_dir, filename)
        if os.path.exists(candidate):
            return candidate
    return None

def prepare_dataset(metadata_path='HAM10000_metadata.csv', 
                    image_dirs=('HAM10000_images_part_1', 'HAM10000_images_part_2'),
                    output_dir='dataset',
                    val_size=0.20,
                    random_state=42,
                    clean_existing=False,
                    dry_run=False):
    
    print(f"Loading metadata from {metadata_path}...")
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file '{metadata_path}' not found.")

    df = pd.read_csv(metadata_path)
    print(f"Total entries in metadata: {len(df)}")
    print(f"Total unique lesions: {df['lesion_id'].nunique()}")

    # Map risk category
    df['risk'] = df['dx'].map(DX_TO_RISK)
    if df['risk'].isnull().any():
        unmapped = df[df['risk'].isnull()]['dx'].unique()
        raise ValueError(f"Unmapped diagnostic categories found: {unmapped}")

    # Perform Leak-Free Group Split by lesion_id
    print(f"\nPerforming GroupSplit on 'lesion_id' (val_size={val_size}, random_state={random_state})...")
    gss = GroupShuffleSplit(n_splits=1, test_size=val_size, random_state=random_state)
    train_idx, val_idx = next(gss.split(df, groups=df['lesion_id']))

    train_df = df.iloc[train_idx].copy()
    val_df = df.iloc[val_idx].copy()

    # Verify zero leakage
    train_lesions = set(train_df['lesion_id'])
    val_lesions = set(val_df['lesion_id'])
    overlap = train_lesions.intersection(val_lesions)
    assert len(overlap) == 0, f"Critical error: Data leakage detected! Overlapping lesions: {len(overlap)}"

    print(f"Data split successful & strictly verified:")
    print(f"  Train: {len(train_df)} images ({len(train_lesions)} unique lesions)")
    print(f"  Val:   {len(val_df)} images ({len(val_lesions)} unique lesions)")
    print(f"  Lesion Overlap: {len(overlap)} (0 = Clean)")

    print("\n--- 7-Class Distribution (Fine-Grained) ---")
    print("Train:\n", train_df['dx'].value_counts())
    print("\nValidation:\n", val_df['dx'].value_counts())

    print("\n--- 3-Tier Risk Distribution (Clinical) ---")
    print("Train:\n", train_df['risk'].value_counts())
    print("\nValidation:\n", val_df['risk'].value_counts())

    if dry_run:
        print("\n[DRY RUN] Skipping file copy operations.")
        return

    # Clean existing dataset folder if requested or clean up legacy 3-folder structure
    if clean_existing and os.path.exists(output_dir):
        print(f"\nCleaning existing output directory '{output_dir}'...")
        shutil.rmtree(output_dir)

    # Create destination directories for 7 classes
    categories = sorted(df['dx'].unique().tolist())
    for split in ['train', 'val']:
        for cat in categories:
            os.makedirs(os.path.join(output_dir, split, cat), exist_ok=True)

    # Process and copy images
    print(f"\nCopying images to '{output_dir}' (7 diagnostic classes)...")
    missing_count = 0

    for split_name, split_data in [('train', train_df), ('val', val_df)]:
        copied = 0
        for _, row in split_data.iterrows():
            img_id = row['image_id']
            dx_class = row['dx']
            src_path = locate_image(img_id, image_dirs)

            if src_path is None:
                missing_count += 1
                continue

            dst_path = os.path.join(output_dir, split_name, dx_class, f"{img_id}.jpg")
            if not os.path.exists(dst_path):
                shutil.copy2(src_path, dst_path)
            copied += 1

        print(f"  Copied/verified {copied} images in '{split_name}' split.")

    if missing_count > 0:
        print(f"Warning: {missing_count} images listed in metadata could not be found in image folders.")
    else:
        print("\nAll dataset images prepared and organized successfully in 7 fine-grained class folders!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Prepare leak-free 7-class HAM10000 dataset for skin lesion classification.")
    parser.add_argument('--metadata', default='HAM10000_metadata.csv', help='Path to HAM10000_metadata.csv')
    parser.add_argument('--output', default='dataset', help='Target dataset directory')
    parser.add_argument('--val_size', type=float, default=0.20, help='Validation split fraction (0.0 to 1.0)')
    parser.add_argument('--random_state', type=int, default=42, help='Random seed for reproducibility')
    parser.add_argument('--clean', action='store_true', help='Clean output directory before creating new structure')
    parser.add_argument('--dry_run', action='store_true', help='Simulate split without copying files')

    args = parser.parse_args()
    prepare_dataset(
        metadata_path=args.metadata,
        output_dir=args.output,
        val_size=args.val_size,
        random_state=args.random_state,
        clean_existing=args.clean,
        dry_run=args.dry_run
    )
