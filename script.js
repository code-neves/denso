// Constants and DOM Elements
const DOM = {
    button: document.querySelector('.file-handler .wrapper button'),
    dropArea: document.body,
    fileHandler: document.querySelector('.file-handler'),
    canvasWrapper: document.querySelector('.canvas-wrapper'),
    canvasDiv: document.getElementById('canvas'),
    pixelVisionCheckbox: document.getElementById('pixelVisionCheckbox'),
    slider: document.getElementById('slider'),
    resolutionDisplay: document.getElementById('resolution'),
    exitButton: document.getElementById('exit-button'),
    waitingElement: document.querySelector('.waiting'),
    editingElement: document.querySelector('.editing'),
    lightContainer: document.querySelector('.lights-container')
};

// Configuration
const CONFIG = {
    scale: 1,
    zoomSpeed: 0.1,
    debounceTime: 500,
    defaultQuality: 0.8
};

// State
const state = {
    currentFile: null,
    debounceTimer: null
};

// File Input Creation
function createHiddenFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    return input;
}

const fileInput = createHiddenFileInput();

// Image Processing Functions
function processImage(file, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = createCanvasWithImage(img);
                    const compressedDataURL = compressImageOnCanvas(canvas, quality);
                    const stats = calculateCompressionStats(file.size, compressedDataURL);
                    
                    resolve({ compressedDataURL, img, stats });
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function createCanvasWithImage(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get canvas context');
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function compressImageOnCanvas(canvas, quality) {
    return canvas.toDataURL('image/jpeg', quality);
}

function calculateCompressionStats(originalSize, compressedDataURL) {
    const originalSizeKB = originalSize / 1024;
    const compressedSizeKB = (compressedDataURL.length * 3 / 4) / 1024;
    const percentageReduction = ((originalSizeKB - compressedSizeKB) / originalSizeKB * 100).toFixed(2);

    return { originalSizeKB, compressedSizeKB, percentageReduction };
}

// UI Update Functions
function updateUI({ compressedDataURL, img, stats }) {
    updateImageDisplay(compressedDataURL, img);
    updateFileInfo(state.currentFile, stats);
    setupDownloadButton(compressedDataURL);
    updateFileHandlerState();
}

function updateImageDisplay(compressedDataURL, img) {
    if (DOM.canvasDiv) {
        Object.assign(DOM.canvasDiv.style, {
            backgroundImage: `url(${compressedDataURL})`,
            width: `${img.width}px`,
            height: `${img.height}px`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            display: 'block'
        });
    }
}

function updateFileHandlerState() {
    DOM.fileHandler.classList.remove('bg-gradient');
    DOM.fileHandler.classList.add('filled');
    DOM.fileHandler.style.background = 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,1))';
    DOM.waitingElement.style.display = 'none';
    DOM.editingElement.style.display = 'flex';
    DOM.lightContainer.style.display = 'none';
}

function updateFileInfo(file, { originalSizeKB, compressedSizeKB, percentageReduction }) {
    const fileInfo = {
        name: document.querySelector('.file-info .name'),
        sizes: document.querySelector('.file-info .sizes'),
        percentage: document.querySelector('.file-info .percentage')
    };

    fileInfo.name.textContent = file.name;
    fileInfo.sizes.textContent = `${originalSizeKB.toFixed(2)}KB > ${compressedSizeKB.toFixed(2)}KB`;
    fileInfo.percentage.textContent = `- ${percentageReduction}%`;
}

// Event Handlers
async function handleFileProcessing(file) {
    if (!file || !file.type.startsWith('image/')) {
        console.error('Invalid file type. Only image files are allowed.');
        return;
    }

    try {
        state.currentFile = file;
        const quality = DOM.slider.value / 100;
        const result = await processImage(file, quality);
        updateUI(result);
    } catch (error) {
        console.error('Error processing image:', error);
        resetUI();
    }
}

function handleDragOver(event) {
    event.preventDefault();
    DOM.dropArea.classList.add('dragging');
}

function handleDragLeave(event) {
    event.preventDefault();
    DOM.dropArea.classList.remove('dragging');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    DOM.dropArea.classList.remove('dragging');

    const file = Array.from(event.dataTransfer.items)
        .find(item => item.kind === 'file' && item.type.startsWith('image/'))
        ?.getAsFile();

    if (file) handleFileProcessing(file);
}

function handlePaste(event) {
    const file = Array.from(event.clipboardData.items)
        .find(item => item.type.startsWith('image/'))
        ?.getAsFile();

    if (file) handleFileProcessing(file);
}

function setupDownloadButton(compressedDataURL) {
    const downloadButton = document.getElementById('download-btn');
    downloadButton.onclick = () => {
        const link = document.createElement('a');
        link.href = compressedDataURL;
        link.download = `compressed-image-${DOM.slider.value}.jpg`;
        link.click();
    };
}

function resetUI() {
    if (DOM.canvasDiv) {
        Object.assign(DOM.canvasDiv.style, {
            backgroundImage: 'none',
            display: 'none'
        });
    }
    
    DOM.fileHandler.classList.add('bg-gradient');
    DOM.fileHandler.classList.remove('filled');
    DOM.fileHandler.style.background = '';
    DOM.waitingElement.style.display = 'flex';
    DOM.editingElement.style.display = 'none';
    DOM.lightContainer.style.display = 'flex';
    fileInput.value = '';
    state.currentFile = null;
}

function handleWheelScroll(event) {
    event.preventDefault();
    CONFIG.scale = Math.min(Math.max(0.1, CONFIG.scale + 
        (Math.sign(event.deltaY) > 0 ? -CONFIG.zoomSpeed : CONFIG.zoomSpeed)), 100);
    DOM.canvasDiv.style.transform = `scale(${CONFIG.scale})`;
}

// Event Listeners
function initializeEventListeners() {
    DOM.button.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => handleFileProcessing(e.target.files[0]));
    DOM.dropArea.addEventListener('dragover', handleDragOver);
    DOM.dropArea.addEventListener('dragleave', handleDragLeave);
    DOM.dropArea.addEventListener('drop', handleFileDrop);
    DOM.fileHandler.addEventListener('wheel', handleWheelScroll, { passive: false });
    document.addEventListener('paste', handlePaste);
    
    DOM.slider.addEventListener('input', () => {
        DOM.resolutionDisplay.textContent = `${DOM.slider.value}%`;
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            if (state.currentFile) {
                handleFileProcessing(state.currentFile);
            }
        }, CONFIG.debounceTime);
    });

    DOM.pixelVisionCheckbox.addEventListener('change', () => {
        DOM.canvasDiv.style.imageRendering = DOM.pixelVisionCheckbox.checked ? 'pixelated' : 'auto';
    });

    DOM.exitButton.addEventListener('click', resetUI);
}

// Initialize the application
initializeEventListeners();