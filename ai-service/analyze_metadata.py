import pandas as pd
import os

# Load the metadata
metadata_path = 'HAM10000_metadata.csv'
if not os.path.exists(metadata_path):
    print(f"Error: {metadata_path} not found.")
    exit(1)

df = pd.read_csv(metadata_path)

print("--- HAM10000 Dataset Overview ---")
print(f"Total number of images: {len(df)}")
print(f"Total number of unique lesions: {df['lesion_id'].nunique()}")

print("\n--- Class Distribution (dx) ---")
class_distribution = df['dx'].value_counts()
print(class_distribution)
print("\nPercentage:")
print((class_distribution / len(df) * 100).round(2).astype(str) + '%')

print("\n--- Sex Distribution ---")
print(df['sex'].value_counts())

print("\n--- Localization Distribution ---")
print(df['localization'].value_counts())

# Now let's map them to risk classes
def map_risk(dx):
    if dx in ['mel', 'bcc']:
        return 'Cancer'
    elif dx == 'akiec':
        return 'Potential Cancer'
    else:
        return 'Not Cancer'

df['risk'] = df['dx'].apply(map_risk)

print("\n--- Risk Class Distribution ---")
risk_distribution = df['risk'].value_counts()
print(risk_distribution)
print("\nPercentage:")
print((risk_distribution / len(df) * 100).round(2).astype(str) + '%')

