let selectedFile = null;
let probChart = null;

const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const uploadForm = document.querySelector('.upload-form');
const resultSection = document.getElementById('result-section');
const predictBtn = document.getElementById('predict-btn');
const loader = document.getElementById('loader');
const contextMenu = document.getElementById('custom-context-menu');

// --- Global Drag and Drop Prevention (prevent browser opening file on accidental drop outside) ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, (e) => {
        e.preventDefault();
    }, false);
});

// --- Drop Area Drag & Drop Handlers ---
if (dropArea) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.add('highlight');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.remove('highlight');
        }, false);
    });

    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            handleFiles(dt.files);
        }
    }, false);
}

// --- File Handling & Preview ---
function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        previewContainer.classList.remove('hidden');
        uploadForm.classList.add('hidden');
        resultSection.classList.add('hidden');
    };
    reader.onerror = function() {
        alert('Error reading image file. Please try another image.');
    };
    reader.readAsDataURL(selectedFile);
}

function clearImage() {
    selectedFile = null;
    if (fileElem) fileElem.value = "";
    if (imagePreview) imagePreview.src = "";
    if (previewContainer) previewContainer.classList.add('hidden');
    if (uploadForm) uploadForm.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    if (probChart) {
        probChart.destroy();
        probChart = null;
    }
}

// --- Clipboard Paste Handling ---
window.addEventListener('paste', handlePaste, false);

function handlePaste(e) {
    if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    handleFiles([blob]);
                    break;
                }
            }
        }
    }
}

// --- Custom Context Menu Handling ---
if (dropArea && contextMenu) {
    dropArea.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.classList.remove('hidden');
    });

    document.addEventListener('click', () => {
        if (!contextMenu.classList.contains('hidden')) {
            contextMenu.classList.add('hidden');
        }
    });
}

async function pasteFromContextMenu() {
    if (contextMenu) contextMenu.classList.add('hidden');
    try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            alert('Clipboard API is not fully supported in this browser. Please use Ctrl+V / ⌘+V to paste images.');
            return;
        }

        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    const blob = await item.getType(type);
                    handleFiles([blob]);
                    return;
                }
            }
        }
        alert('No image found in clipboard. Copy an image first and try again.');
    } catch (err) {
        console.warn('Clipboard read error:', err);
        alert('Could not access clipboard directly. Please press Ctrl+V / ⌘+V to paste the image.');
    }
}

// --- API Request ---
async function uploadImage() {
    if (!selectedFile) {
        alert('Please choose or paste an image first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Update UI Loading State
    if (predictBtn) predictBtn.disabled = true;
    if (loader) loader.classList.remove('hidden');

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || `Server responded with status ${response.status}`);
        }

        displayResults(data);
    } catch (e) {
        console.error('Prediction failed:', e);
        alert(`Prediction Error: ${e.message || 'An unexpected error occurred.'}`);
    } finally {
        if (predictBtn) predictBtn.disabled = false;
        if (loader) loader.classList.add('hidden');
    }
}

// --- Result Rendering ---
function displayResults(data) {
    if (!resultSection) return;
    resultSection.classList.remove('hidden');

    // Update Text Metrics
    const predictionText = document.getElementById('prediction');
    if (predictionText) {
        const confidencePct = (data.confidence * 100).toFixed(1);
        predictionText.innerHTML = `Identified Risk: <br><strong>${data.prediction}</strong> 
                                    <br><span style="font-size:1rem;font-weight:400;color:rgba(255, 255, 255, 0.85)">
                                    Confidence: ${confidencePct}%</span>`;
        
        if (data.risk_color) {
            predictionText.style.color = data.risk_color;
        }
    }

    // Update Chart
    if (data.all_probabilities) {
        renderChart(data.all_probabilities);
    }

    // Smooth scroll to results on smaller screens
    if (window.innerWidth < 768) {
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderChart(probabilities) {
    const canvas = document.getElementById('confidenceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sort probabilities descending
    const sortedProbs = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
    const labels = sortedProbs.map(item => item[0]);
    const data = sortedProbs.map(item => (item[1] * 100).toFixed(1));

    const borderColors = [];
    const bgColors = [];

    labels.forEach(label => {
        if (label === 'Cancer') {
            borderColors.push('#ff6b6b');
            bgColors.push('rgba(255, 107, 107, 0.8)');
        } else if (label === 'Potential Cancer') {
            borderColors.push('#ffd166');
            bgColors.push('rgba(255, 209, 102, 0.8)');
        } else {
            borderColors.push('#4ade80');
            bgColors.push('rgba(74, 222, 128, 0.8)');
        }
    });

    if (probChart) {
        probChart.destroy();
    }

    probChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Confidence (%)',
                data: data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.85)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.85)' }
                }
            }
        }
    });
}
