// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture") {
        chrome.tabs.captureVisibleTab(null, {format: "png"}, (dataUrl) => {
            sendResponse({imgUrl: dataUrl});
        });
        return true;
    }
    else if (request.action === "captureRegion") {
        chrome.scripting.insertCSS({
            target: { tabId: sender.tab.id },
            css: `
                .screenshot-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 999999;
                    cursor: crosshair;
                }
                .screenshot-selection {
                    position: absolute;
                    border: 2px solid #4CAF50;
                    background: rgba(76,175,80,0.1);
                }
            `
        });
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            function: initializeSelection
        });
    }
    else if (request.action === "regionSelected") {
        chrome.tabs.captureVisibleTab(null, {format: "png"}, (dataUrl) => {
            // Process the captured region
            const region = request.region;
            const img = new Image();
            img.onload = () => {
                const canvas = new OffscreenCanvas(region.width, region.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img,
                    region.x * region.devicePixelRatio,
                    region.y * region.devicePixelRatio,
                    region.width * region.devicePixelRatio,
                    region.height * region.devicePixelRatio,
                    0, 0, region.width, region.height
                );
                canvas.convertToBlob().then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        chrome.runtime.sendMessage({
                            action: "capture",
                            imgUrl: reader.result
                        });
                    };
                    reader.readAsDataURL(blob);
                });
            };
            img.src = dataUrl;
        });
    } else  if (request.action === "captureFullPage") {
        captureFullPage().then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                chrome.runtime.sendMessage({
                    action: "capture",
                    imgUrl: reader.result
                });
            };
            reader.readAsDataURL(blob);
        }).catch(error => {
            console.error('Full page capture failed:', error);
        });
        return true;  // Will respond asynchronously
    }
    return true;
});

function initializeSelection() {
    let startX, startY;
    let isSelecting = false;

    const overlay = document.createElement('div');
    overlay.className = 'screenshot-overlay';
    document.body.appendChild(overlay);

    const selection = document.createElement('div');
    selection.className = 'screenshot-selection';
    overlay.appendChild(selection);

    overlay.addEventListener('mousedown', (e) => {
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selection.style.left = startX + 'px';
        selection.style.top = startY + 'px';
        selection.style.width = '0';
        selection.style.height = '0';
    });

    overlay.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selection.style.left = Math.min(startX, currentX) + 'px';
        selection.style.top = Math.min(startY, currentY) + 'px';
        selection.style.width = width + 'px';
        selection.style.height = height + 'px';
    });

    overlay.addEventListener('mouseup', (e) => {
        isSelecting = false;
        const rect = selection.getBoundingClientRect();

        setTimeout(() => {
            overlay.remove();
            chrome.runtime.sendMessage({
                action: 'regionSelected',
                region: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    devicePixelRatio: window.devicePixelRatio
                }
            });
        }, 100);
    });
}
