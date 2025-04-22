let downloadInterval;
let isContextValid = true;

function checkContextValidity() {
    try {
        return !!chrome.runtime?.id;
    } catch (e) {
        return false;
    }
}

function cleanup() {
    clearInterval(downloadInterval);
    isContextValid = false;
    document.querySelectorAll(".social-download-btn").forEach(btn => {
        btn.remove();
    });
}

function extractMediaUrls(container) {
    const mediaUrls = [];
    
    // Image handling for Facebook
    const imageElements = container.querySelectorAll('img[src*="scontent"], img[src*="fbcdn"]');
    imageElements.forEach(img => {
        let url = img.src;
        // Get highest quality image
        url = url.replace(/&?[wh]\d+/g, '').replace(/&?s=\d+/g, '');
        
        if (url && !mediaUrls.some(m => m.url === url)) {
            mediaUrls.push({
                url: url,
                isWebP: url.toLowerCase().includes('.webp')
            });
        }
    });

    return mediaUrls;
}

function handleDownload(mediaUrls) {
    if (!checkContextValidity()) {
        cleanup();
        return;
    }

    try {
        mediaUrls.forEach((media, index) => {
            chrome.runtime.sendMessage({
                action: "download",
                url: media.url,
                filename: `facebook-photo-${Date.now()}-${index + 1}${media.isWebP ? '.webp' : '.jpg'}`,
                isWebP: media.isWebP,
                platform: 'facebook'
            });
        });
    } catch (e) {
        console.error('Download error:', e);
        cleanup();
    }
}

function addDownloadButton(container) {
    if (!container || container.querySelector(".social-download-btn")) return;

    const mediaUrls = extractMediaUrls(container);
    if (mediaUrls.length === 0) return;

    const downloadContainer = document.createElement("div");
    downloadContainer.className = "download-container";
    downloadContainer.style.cssText = `
         position: absolute;
                top: 15px;
                right: 15px;
                z-index: 99999;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 8px;
                padding: 8px;
                pointer-events: auto;
                display: flex;
                gap: 8px;
    `;

    const downloadBtn = document.createElement("img");
    try {
        downloadBtn.src = chrome.runtime.getURL("icon/download_Fb.jpeg");
    } catch (e) {
        console.error("Error loading button image:", e);
        return;
    }

    downloadBtn.className = "social-download-btn";
    downloadBtn.style.cssText = `
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: block;
        transition: transform 0.2s;
    `;

    downloadBtn.addEventListener('mouseover', () => {
        downloadBtn.style.transform = 'scale(1.1)';
    });

    downloadBtn.addEventListener('mouseout', () => {
        downloadBtn.style.transform = 'scale(1)';
    });

    downloadBtn.addEventListener('click', () => {
        handleDownload(mediaUrls);
    });

    downloadContainer.appendChild(downloadBtn);
    
    // Make sure container is relative for absolute positioning
    const parentStyle = window.getComputedStyle(container);
    if (parentStyle.position === 'static') {
        container.style.position = 'relative';
    }
    
    container.appendChild(downloadContainer);
}

function scanPage() {
    if (!checkContextValidity()) {
        cleanup();
        return;
    }

    try {
        // Scan for feed posts
        document.querySelectorAll('div[role="article"]').forEach(article => {
            const mediaContainers = article.querySelectorAll('div[data-visualcompletion="media-vc-image"]');
            mediaContainers.forEach(container => {
                if (container && !container.querySelector('.social-download-btn')) {
                    addDownloadButton(container);
                }
            });
        });

        // Scan for single photo view
        const lightboxImage = document.querySelector('div[role="dialog"] img[data-visualcompletion="media-vc-image"]');
        if (lightboxImage) {
            const container = lightboxImage.closest('div[role="dialog"]');
            if (container && !container.querySelector('.social-download-btn')) {
                addDownloadButton(container);
            }
        }
    } catch (error) {
        console.error("Error in scanPage:", error);
    }
}

downloadInterval = setInterval(scanPage, 1000);

if (chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
        if (message === "contextInvalidated") {
            cleanup();
        }
    });
}

window.addEventListener('unload', cleanup);