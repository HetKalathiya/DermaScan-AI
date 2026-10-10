import os
import io
import uuid
import socket
import base64
import ipaddress
import urllib.request
from urllib.parse import urlparse

import torch
import torch.nn as nn
from torchvision import transforms, models
from flask import Flask, request, jsonify, render_template, Response
from werkzeug.utils import secure_filename
from PIL import Image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- Configuration & Clinical Mappings ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = 'best_model.pth'

DX_TO_RISK = {
    'mel': 'Cancer',            # Melanoma
    'bcc': 'Cancer',            # Basal cell carcinoma
    'akiec': 'Potential Cancer',# Actinic keratoses / Bowen's disease
    'nv': 'Not Cancer',         # Melanocytic nevi
    'bkl': 'Not Cancer',        # Benign keratosis-like lesions
    'df': 'Not Cancer',         # Dermatofibroma
    'vasc': 'Not Cancer'        # Vascular lesions
}

DX_FULL_NAMES = {
    'akiec': "Actinic Keratosis / Bowen's Disease",
    'bcc': "Basal Cell Carcinoma",
    'bkl': "Benign Keratosis-like Lesion",
    'df': "Dermatofibroma",
    'mel': "Melanoma",
    'nv': "Melanocytic Nevus",
    'vasc': "Vascular Lesion"
}

# Define risk mapping colors for frontend
risk_colors = {
    'Cancer': '#ff6b6b',          # Brighter Red
    'Potential Cancer': '#ffd166', # Brighter Yellow
    'Not Cancer': '#4ade80'        # Brighter Green
}

DEFAULT_CLASSES = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc']
class_names = DEFAULT_CLASSES.copy()

# --- Load Model Architecture ---
def build_model(num_classes):
    weights = models.EfficientNet_B3_Weights.DEFAULT
    net = models.efficientnet_b3(weights=weights)
    num_ftrs = net.classifier[1].in_features
    net.classifier[1] = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, num_classes)
    )
    return net

model = build_model(len(class_names))

if os.path.exists(model_path):
    try:
        checkpoint = torch.load(model_path, map_location=device)
        saved_classes = checkpoint.get('class_names', class_names)
        if len(saved_classes) != len(class_names):
            class_names = saved_classes
            model = build_model(len(class_names))
        else:
            class_names = saved_classes
            
        model.load_state_dict(checkpoint['model_state_dict'])
        print(f"Model loaded successfully with {len(class_names)} classes: {class_names}")
    except Exception as e:
        print(f"Error loading checkpoint {model_path}: {e}")
else:
    print(f"Warning: {model_path} not found. Running with baseline initialized weights.")

model = model.to(device)
model.eval()

# --- Preprocessing Pipeline ---
predict_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_safe_url(target_url):
    """Mitigate SSRF by validating scheme and ensuring target IP is public."""
    try:
        parsed = urlparse(target_url)
        if parsed.scheme not in ('http', 'https'):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False

        addr_info = socket.getaddrinfo(hostname, None)
        for item in addr_info:
            ip = ipaddress.ip_address(item[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return False
        return True
    except Exception:
        return False

def predict_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        tensor = predict_transforms(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            raw_logits = model(tensor)
            
            # Standard temperature scaling
            TEMPERATURE = 1.0 
            scaled_logits = raw_logits / TEMPERATURE
            
            raw_probabilities = torch.nn.functional.softmax(scaled_logits, dim=1)[0].cpu().numpy()
            
            # Case 1: Fine-grained 7-class model -> Collapse to 3 clinical risk tiers
            if set(class_names).issubset(set(DX_TO_RISK.keys())):
                fine_grained_dict = {
                    class_names[i]: float(raw_probabilities[i])
                    for i in range(len(class_names))
                }
                
                # Compute Marginalized Probabilities per Clinical Risk Tier
                cancer_prob = sum(fine_grained_dict.get(c, 0.0) for c in ['mel', 'bcc'])
                pot_cancer_prob = sum(fine_grained_dict.get(c, 0.0) for c in ['akiec'])
                not_cancer_prob = sum(fine_grained_dict.get(c, 0.0) for c in ['nv', 'bkl', 'df', 'vasc'])

                # 3-tier dictionary for chart
                probs_dict = {
                    'Cancer': float(cancer_prob),
                    'Potential Cancer': float(pot_cancer_prob),
                    'Not Cancer': float(not_cancer_prob)
                }

                # Clinical Operating Thresholds (Safety Triage Policy)
                CANCER_THRESHOLD = float(os.environ.get('CANCER_THRESHOLD', 0.28))
                POTENTIAL_CANCER_THRESHOLD = float(os.environ.get('POTENTIAL_CANCER_THRESHOLD', 0.30))

                # Hierarchical Clinical Triage Decision Rule
                if cancer_prob >= CANCER_THRESHOLD:
                    predicted_class = 'Cancer'
                    confidence = float(cancer_prob)
                elif (cancer_prob + pot_cancer_prob) >= POTENTIAL_CANCER_THRESHOLD:
                    predicted_class = 'Potential Cancer'
                    confidence = float(pot_cancer_prob)
                else:
                    predicted_class = 'Not Cancer'
                    confidence = float(not_cancer_prob)

                # Top fine-grained diagnosis
                top_dx = max(fine_grained_dict, key=fine_grained_dict.get)
                top_dx_name = DX_FULL_NAMES.get(top_dx, top_dx)
                top_dx_conf = fine_grained_dict[top_dx]

                return {
                    'success': True,
                    'prediction': predicted_class,
                    'confidence': float(confidence),
                    'risk_color': risk_colors.get(predicted_class, '#6c757d'),
                    'all_probabilities': probs_dict,
                    'thresholds_applied': {
                        'cancer_threshold': CANCER_THRESHOLD,
                        'potential_cancer_threshold': POTENTIAL_CANCER_THRESHOLD
                    },
                    'top_diagnosis': {
                        'code': top_dx,
                        'name': top_dx_name,
                        'confidence': float(top_dx_conf)
                    },
                    'fine_grained_probabilities': fine_grained_dict
                }
            
            # Case 2: Direct 3-tier legacy model fallback
            top_prob = float(raw_probabilities.max())
            top_class_idx = int(raw_probabilities.argmax())
            predicted_class = class_names[top_class_idx]
            
            probs_dict = {
                class_names[i]: float(raw_probabilities[i]) 
                for i in range(len(class_names))
            }
            
            return {
                'success': True,
                'prediction': predicted_class,
                'confidence': top_prob,
                'risk_color': risk_colors.get(predicted_class, '#6c757d'),
                'all_probabilities': probs_dict
            }

    except Exception as e:
        return {
            'success': False,
            'error': f"Failed to process image: {str(e)}"
        }

# --- CORS & Options Handling ---
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return ('', 204)
    return jsonify({
        'status': 'ok',
        'service': 'DermaScan-AI-Model',
        'model': 'EfficientNet-B3',
        'device': str(device),
        'classes': class_names
    }), 200

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return ('', 204)

    img_bytes = None
    file_ext = 'jpg'

    # Check 1: Multipart file upload ('file' or 'image')
    if 'file' in request.files or 'image' in request.files:
        file = request.files.get('file') or request.files.get('image')
        if file and file.filename != '':
            if not allowed_file(file.filename):
                return jsonify({'error': f'Unsupported file type. Allowed extensions: {", ".join(ALLOWED_EXTENSIONS)}'}), 415
            img_bytes = file.read()
            if '.' in file.filename:
                file_ext = file.filename.rsplit('.', 1)[1].lower()

    # Check 2: JSON payload with base64 encoded image
    if img_bytes is None and request.is_json:
        data = request.get_json(silent=True) or {}
        raw_b64 = data.get('image') or data.get('image_base64') or data.get('file')
        if raw_b64 and isinstance(raw_b64, str):
            try:
                # Strip data URL prefix if present (e.g. data:image/png;base64,...)
                if ',' in raw_b64:
                    header, raw_b64 = raw_b64.split(',', 1)
                    if 'image/png' in header:
                        file_ext = 'png'
                    elif 'image/webp' in header:
                        file_ext = 'webp'
                    else:
                        file_ext = 'jpg'
                img_bytes = base64.b64decode(raw_b64)
            except Exception as b64_err:
                return jsonify({'error': f'Invalid base64 image data: {str(b64_err)}'}), 400

    if not img_bytes or len(img_bytes) == 0:
        return jsonify({'error': 'No image provided. Upload a file or send a base64 encoded image in JSON.'}), 400

    if len(img_bytes) > app.config['MAX_CONTENT_LENGTH']:
        return jsonify({'error': 'Image exceeds maximum allowed size (16MB)'}), 413

    try:
        # Validate that bytes represent a valid image
        try:
            with Image.open(io.BytesIO(img_bytes)) as img_test:
                img_test.verify()
        except Exception:
            return jsonify({'error': 'Uploaded file is corrupted or not a valid image'}), 400

        # Unique filename using UUID to prevent collisions and browser cache bugs
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        with open(filepath, 'wb') as f:
            f.write(img_bytes)
            
        result = predict_image(img_bytes)
        if not result.get('success'):
            return jsonify({'error': result.get('error', 'Prediction failed')}), 500

        result['image_url'] = f'/static/uploads/{unique_filename}'
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': f'Server error during prediction: {str(e)}'}), 500

@app.route('/proxy-image', methods=['POST', 'OPTIONS'])
def proxy_image():
    if request.method == 'OPTIONS':
        return ('', 204)
    data = request.get_json(silent=True)
    if not data or not data.get('url'):
        return jsonify({'error': 'Missing image URL'}), 400

    url = data.get('url')
    if not is_safe_url(url):
        return jsonify({'error': 'Invalid or restricted image URL'}), 400

    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DermaScanAI/1.0'}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            content_type = response.info().get_content_type()
            if not content_type.startswith('image/'):
                return jsonify({'error': 'Target URL did not return a valid image'}), 400
            
            image_bytes = response.read()
            if len(image_bytes) > app.config['MAX_CONTENT_LENGTH']:
                return jsonify({'error': 'Image exceeds maximum allowed size'}), 400

            # Validate image integrity
            with Image.open(io.BytesIO(image_bytes)) as img_test:
                img_test.verify()

            return Response(image_bytes, mimetype=content_type)
    except Exception as e:
        return jsonify({'error': f"Failed to retrieve image: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting DermaScan AI Model Service on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)

