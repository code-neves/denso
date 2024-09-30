const button = document.querySelector('.file-handler .wrapper button');
const fileInput = createHiddenFileInput();
const dropArea = document.body;
const fileHandler = document.querySelector('.file-handler');
const canvasWrapper = document.querySelector('.canvas-wrapper');
const canvasDiv = document.getElementById('canvas');

let scale = 1;
const zoomSpeed = 0.1;
let isPanning = false;
let startX, startY, initialScrollLeft, initialScrollTop;

button.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelection);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('dragleave', handleDragLeave);
dropArea.addEventListener('drop', handleFileDrop);
fileHandler.addEventListener('wheel', handleWheelScroll, { passive: false });


function createHiddenFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    return input;
}

function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        processImage(file, 1);  
    }
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.remove('dragging');

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processImage(file, 1);  
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.add('dragging');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dropArea.classList.remove('dragging');
}

function processImage(file, quality) {
    const reader = new FileReader();
    reader.onload = (event) => {
        loadImageAndCompress(event.target.result, quality, file);
    };
    reader.readAsDataURL(file);
}

function loadImageAndCompress(imageSrc, quality, file) {
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
        const canvas = createCanvasWithImage(img);
        const compressedDataURL = compressImageOnCanvas(canvas, quality);
        const { originalSizeKB, compressedSizeKB, percentageReduction } = calculateCompressionStats(file.size, compressedDataURL);
        
        updateUIWithCompressedImage(compressedDataURL, img.width, img.height);
        updateFileInfo(file, originalSizeKB, compressedSizeKB, percentageReduction);
        setupDownloadButton(compressedDataURL);
    };
}

function createCanvasWithImage(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = createCanvasContext(canvas);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function createCanvasContext(canvas) {
    return canvas.getContext('2d', { willReadFrequently: true });
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

function updateUIWithCompressedImage(compressedDataURL, imgWidth, imgHeight) {
    if (canvasDiv) {
        canvasDiv.style.backgroundImage = `url(${compressedDataURL})`; 
        canvasDiv.style.width = `${imgWidth}px`; 
        canvasDiv.style.height = `${imgHeight}px`;
        canvasDiv.style.backgroundSize = 'contain';
        canvasDiv.style.backgroundRepeat = 'no-repeat';
        canvasDiv.style.backgroundPosition = 'center';
        canvasDiv.style.display = 'block'; 
    }
    fileHandler.classList.remove('bg-gradient');
    fileHandler.classList.add('filled');
    fileHandler.style.background = 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,1))'; 
    document.querySelector('.waiting').style.display = 'none';
    document.querySelector('.editing').style.display = 'flex';
}


function updateFileInfo(file, originalSizeKB, compressedSizeKB, percentageReduction) {
    document.querySelector('.file-info .name').textContent = file.name;
    document.querySelector('.file-info .sizes').textContent = `${originalSizeKB.toFixed(2)}KB > ${compressedSizeKB.toFixed(2)}KB`;
    document.querySelector('.file-info .percentage').textContent = `- ${percentageReduction}%`;
}

function setupDownloadButton(compressedDataURL) {
    const downloadButton = document.getElementById('download-btn');
    downloadButton.onclick = () => {
        const quality = slider.value;
        downloadImage(compressedDataURL, quality);
    };
}

function downloadImage(compressedDataURL, quality) {
    const link = document.createElement('a');
    link.href = compressedDataURL;
    link.download = `compressed-image-${quality}.jpg`;
    link.click();
}

let debounceTimer;
const slider = document.getElementById('slider');
const resolutionDisplay = document.getElementById('resolution');

slider.addEventListener('input', () => {
    resolutionDisplay.textContent = `${slider.value}%`;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const quality = slider.value / 100;
        processImage(fileInput.files[0], quality);
    }, 500);
});

const pixelVisionCheckbox = document.getElementById('pixelVisionCheckbox');
pixelVisionCheckbox.addEventListener('change', () => {
    const canvasDiv = document.querySelector('.canvas');
    if (canvasDiv) {
        canvasDiv.style.imageRendering = pixelVisionCheckbox.checked ? 'pixelated' : 'auto';
    }
});

const exitButton = document.getElementById('exit-button');
exitButton.addEventListener('click', resetUI);

function resetUI() {
    if (canvasDiv) {
        canvasDiv.style.backgroundImage = 'none';
        canvasDiv.style.display = 'none'; 
    }
    fileHandler.classList.add('bg-gradient');
    fileHandler.classList.remove('filled');
    fileHandler.style.background = ''; 
    document.querySelector('.waiting').style.display = 'flex';
    document.querySelector('.editing').style.display = 'none';
    fileInput.value = ''; 
}

function handleWheelScroll(event) {
    event.preventDefault();
    scale = Math.min(Math.max(0.1, scale + (Math.sign(event.deltaY) > 0 ? -zoomSpeed : zoomSpeed)), 100);
    canvasDiv.style.transform = `scale(${scale})`;
}




