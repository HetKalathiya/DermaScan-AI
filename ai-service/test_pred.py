import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json

device = torch.device('cpu')
model_path = 'best_model.pth'
class_names = ['Cancer', 'Not Cancer', 'Potential Cancer']

# Load model
weights = models.EfficientNet_B3_Weights.DEFAULT
model = models.efficientnet_b3(weights=weights)
num_ftrs = model.classifier[1].in_features
model.classifier[1] = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(num_ftrs, len(class_names))
)

checkpoint = torch.load(model_path, map_location=device)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

# Transforms
predict_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

folder = 'dataset/val/Not Cancer'
images = os.listdir(folder)

results = []
for img_name in images:
    img_path = os.path.join(folder, img_name)
    image = Image.open(img_path).convert('RGB')
    tensor = predict_transforms(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        raw_logits = model(tensor)
        
        # Apply temperature scaling to sharpen the probabilities
        TEMPERATURE = 0.5 
        scaled_logits = raw_logits / TEMPERATURE
        
        prob_raw = torch.nn.functional.softmax(raw_logits, dim=1)[0]
        prob_scaled = torch.nn.functional.softmax(scaled_logits, dim=1)[0]
        
        top_prob_scaled, top_class_idx_scaled = torch.max(prob_scaled, dim=0)
        
        if top_class_idx_scaled.item() == 0:  # Cancer
            results.append({
                "image": img_name,
                "pred_prob": top_prob_scaled.item()
            })

with open('out_cancer_preds.json', 'w') as f:
    json.dump(results, f, indent=2)
