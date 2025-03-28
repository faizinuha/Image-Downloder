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
    document.querySelectorAll(".ig-download-btn").forEach(btn => {
        btn.style.opacity = "1.0";
        btn.style.cursor = "not-allowed";
        btn.onclick = null;
    });
}

function addDownloadButton() {
    if (!checkContextValidity()) {
        cleanup();
        return;
    }

    try {
        document.querySelectorAll("article").forEach(article => {
            if (!isContextValid || article.querySelector(".ig-download-btn")) return;

            // Debug log
            console.log("Found article:", article);

            // Perbaikan selector dan positioning
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

            let downloadBtn = document.createElement("img");
            try {
                downloadBtn.src = chrome.runtime.getURL("button-download.png");
            } catch (e) {
                console.error("Error loading button image:", e);
                cleanup();
                return;
            }

            downloadBtn.className = "ig-download-btn";
            downloadBtn.style.cssText = `
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: block;
                transition: transform 0.2s;
                opacity: 1;
            `;

            // Hover effect
            downloadBtn.onmouseover = () => {
                downloadBtn.style.transform = 'scale(1.1)';
            };
            downloadBtn.onmouseout = () => {
                downloadBtn.style.transform = 'scale(1)';
            };

            let mediaElements = article.querySelectorAll("._aagv img, video");
            let mediaUrls = Array.from(mediaElements).map(media => {
                const url = media.src;
                const isVideo = media.tagName.toLowerCase() === 'video';
                const isWebP = url.toLowerCase().includes('.webp');
                return {
                    url: url,
                    isVideo: isVideo,
                    isWebP: isWebP
                };
            });
            
            if (mediaUrls.length === 0) return;

            downloadBtn.onclick = () => {
                if (!checkContextValidity()) {
                    cleanup();
                    return;
                }

                try {
                    mediaUrls.forEach((media, index) => {
                        chrome.runtime.sendMessage({
                            action: "download",
                            url: media.url,
                            filename: `523728637512-${media.isVideo ? 'video' : 'photo'}-${index + 1}${media.isVideo ? '.mp4' : (media.isWebP ? '.png' : '.jpg')}`,
                            isWebP: media.isWebP
                        });
                    });
                } catch (e) {
                    cleanup();
                }
            };

            downloadContainer.appendChild(downloadBtn);
            
            // Perbaikan selector untuk container media
            const mediaContainer = article.querySelector("._aagv") || 
                                 article.querySelector("._ab8w") ||
                                 article.querySelector("._aalb") ||
                                 article.querySelector("[role='button']");

            if (mediaContainer) {
                // Pastikan parent container memiliki positioning yang tepat
                mediaContainer.style.cssText += `
                    position: relative !important;
                    display: block;
                `;
                
                // Cari parent yang mungkin mempengaruhi positioning
                const parentContainer = mediaContainer.closest("._aamf, ._aagv, ._ab8w");
                if (parentContainer) {
                    parentContainer.style.position = 'relative';
                }

                mediaContainer.appendChild(downloadContainer);
            } else {
                console.error("Media container not found");
            }
        });
    } catch (error) {
        console.error("Error in addDownloadButton:", error);
        cleanup();
    }
}

// Kurangi interval untuk debugging
downloadInterval = setInterval(addDownloadButton, 1000);

if (chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
        if (message === "contextInvalidated") {
            cleanup();
        }
    });
}

// Add unload listener to clean up
window.addEventListener('unload', cleanup);