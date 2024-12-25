let canvas, ctx;
let isDrawing = false;
let tool = 'pen';
let color = '#ff0000';
let size = 5;
let undoStack = [];
let currentEmoji = '😊';
let lastX, lastY;

// Initialize tools
document.querySelectorAll('.tool-button').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        tool = button.id;
    });
});

// Capture handlers
document.getElementById('captureVisible').addEventListener('click', captureVisible);
document.getElementById('captureRegion').addEventListener('click', captureRegion);
document.getElementById('captureScroll').addEventListener('click', captureFullPage)
document.getElementById('captureDelayed').addEventListener('click', captureDelayed);

// Tool settings
document.getElementById('colorPicker').addEventListener('input', (e) => color = e.target.value);
document.getElementById('sizeSlider').addEventListener('input', (e) => size = parseInt(e.target.value));

// Action handlers
document.getElementById('copy').addEventListener('click', copyToClipboard);
document.getElementById('save').addEventListener('click', saveScreenshot);
document.getElementById('share').addEventListener('click', shareScreenshot);
document.getElementById('undo').addEventListener('click', undo);

// Filter handlers
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => applyFilter(button.dataset.filter));
});

function captureVisible() {
    chrome.runtime.sendMessage({action: "capture"}, (response) => {
        loadImage(response.imgUrl);
    });
}

function captureRegion() {
    chrome.runtime.sendMessage({action: "captureRegion"});
}

function captureScrolling() {
    // Implementation for full page scrolling capture
    chrome.tabs.executeScript({
        code: `
      let fullHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      let fullWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth
      );
      ({fullHeight, fullWidth});
    `
    }, (dimensions) => {
        // Capture logic for full page
    });
}

function captureDelayed() {
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        if (countdown > 0) {
            chrome.action.setBadgeText({text: countdown.toString()});
            countdown--;
        } else {
            clearInterval(countdownInterval);
            chrome.action.setBadgeText({text: ''});
            captureVisible();
        }
    }, 1000);
}

function loadImage(url) {
    const img = new Image();
    img.src = url;
    img.onload = () => {
        document.getElementById('editor').style.display = 'block';
        setupCanvas(img);
        saveState(); // Initial state
    };
}

function setupCanvas(img) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;

    switch(tool) {
        case 'pen':
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            break;

        case 'text':
            const text = prompt('Enter text:', '');
            if (text) {
                ctx.font = `${size}px Arial`;
                ctx.fillText(text, x, y);
                saveState();
            }
            isDrawing = false;
            break;

        case 'arrow':
            drawArrow(lastX, lastY, x, y);
            break;

        case 'rectangle':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
            ctx.strokeRect(lastX, lastY, x - lastX, y - lastY);
            break;

        case 'highlight':
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            break;

        case 'blur':
            const radius = size;
            ctx.filter = `blur(${radius}px)`;
            ctx.drawImage(canvas, x - radius, y - radius, radius * 2, radius * 2,
                x - radius, y - radius, radius * 2, radius * 2);
            ctx.filter = 'none';
            break;

        case 'emoji':
            ctx.font = `${size * 2}px Arial`;
            ctx.fillText(currentEmoji, x, y);
            break;
    }

    lastX = x;
    lastY = y;
}

function drawArrow(fromx, fromy, tox, toy) {
    const headlen = size * 2;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}
async function copyToClipboard() {
    try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        showNotification('Screenshot copied!');
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy screenshot', 'error');
    }
}

function saveScreenshot() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;

    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        showNotification('Screenshot saved!');
    });
}

async function shareScreenshot() {
    try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        const file = new File([blob], 'screenshot.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Screenshot',
                text: 'Check out this screenshot!'
            });
            showNotification('Screenshot shared!');
        } else {
            throw new Error('Sharing not supported');
        }
    } catch (err) {
        console.error('Failed to share:', err);
        showNotification('Failed to share screenshot', 'error');
    }
}

function undo() {
    if (undoStack.length > 1) {
        undoStack.pop(); // Remove current state
        ctx.putImageData(undoStack[undoStack.length - 1], 0, 0); // Apply previous state
        showNotification('Undo successful');
    } else {
        showNotification('Nothing to undo', 'warning');
    }
}
// document.getElementById('captureRegion').addEventListener('click', () => {
//     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//         chrome.tabs.sendMessage(tabs[0].id, {action: "captureRegion"});
//         window.close(); // Close popup to show the webpage
//     });
// });


async function captureFullPage() {
    // First get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
        throw new Error('No active tab found');
    }

    // Get page dimensions and device pixel ratio
    const [{result: pageInfo}] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
            scrollWidth: Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth
            ),
            scrollHeight: Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            ),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        })
    });

    // Create canvas with full page dimensions
    const canvas = new OffscreenCanvas(
        pageInfo.scrollWidth * pageInfo.devicePixelRatio,
        pageInfo.scrollHeight * pageInfo.devicePixelRatio
    );
    const ctx = canvas.getContext('2d');

    // Save original scroll position
    const [{result: originalScroll}] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
            x: window.scrollX,
            y: window.scrollY
        })
    });

    try {
        // Capture viewport by viewport
        for (let y = 0; y < pageInfo.scrollHeight; y += pageInfo.viewportHeight) {
            for (let x = 0; x < pageInfo.scrollWidth; x += pageInfo.viewportWidth) {
                // Scroll to position
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (x, y) => window.scrollTo(x, y),
                    args: [x, y]
                });

                // Wait for any dynamic content/scrolling to settle
                await new Promise(resolve => setTimeout(resolve, 150));

                // Capture the current viewport
                const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
                const img = await createImageBitmap(await (await fetch(dataUrl)).blob());

                // Draw it onto the canvas at the correct position
                ctx.drawImage(
                    img,
                    0, 0, img.width, img.height,  // Source rectangle
                    x * pageInfo.devicePixelRatio,
                    y * pageInfo.devicePixelRatio,
                    pageInfo.viewportWidth * pageInfo.devicePixelRatio,
                    pageInfo.viewportHeight * pageInfo.devicePixelRatio  // Destination rectangle
                );
            }
        }

        // Return to original scroll position
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (x, y) => window.scrollTo(x, y),
            args: [originalScroll.x, originalScroll.y]
        });

        return await canvas.convertToBlob();
    } catch (error) {
        console.error('Full page capture failed:', error);
        throw error;
    }
}