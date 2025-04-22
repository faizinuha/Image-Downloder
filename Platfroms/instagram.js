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
        btn.style.opacity = "1.0";
        btn.style.cursor = "not-allowed";
        btn.replaceWith(btn.cloneNode(true));
    });
}

function getAllMediaFromArticle(article) {
    const mediaUrls = [];
    
    // Cek semua container slide yang mungkin
    const slideContainers = article.querySelectorAll('._acay, ._aabd, ._aagw, ul[role="menu"]');
    
    slideContainers.forEach(container => {
        // Cari hanya gambar (tanpa video)
        const mediaElements = container.querySelectorAll('img[src*="instagram"]');
        
        mediaElements.forEach(media => {
            const url = media.src || media.currentSrc;
            if (url && !mediaUrls.some(m => m.url === url)) {
                mediaUrls.push({
                    url: url,
                    isWebP: url.toLowerCase().includes('.webp')
                });
            }
        });
    });

    // Jika tidak ada slide, cek media tunggal
    if (mediaUrls.length === 0) {
        const singleMedia = article.querySelectorAll('._aagv img, ._ab8w img');
        singleMedia.forEach(media => {
            const url = media.src || media.currentSrc;
            if (url) {
                mediaUrls.push({
                    url: url,
                    isWebP: url.toLowerCase().includes('.webp')
                });
            }
        });
    }

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
                filename: `instagram-photo-${Date.now()}-${index + 1}${media.isWebP ? '.webp' : '.jpg'}`,
                isWebP: media.isWebP,
                platform: 'instagram'
            });
        });
    } catch (e) {
        console.error('Download error:', e);
        cleanup();
    }
}

function addDownloadButton() {
    if (!checkContextValidity()) {
        cleanup();
        return;
    }

    try {
        document.querySelectorAll("article").forEach(article => {
            if (!isContextValid || article.querySelector(".social-download-btn")) return;

            const mediaUrls = getAllMediaFromArticle(article);
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

            let downloadBtn = document.createElement("img");
            try {
                downloadBtn.src = chrome.runtime.getURL("icon/instagram.jpg");
            } catch (e) {
                console.error("Error loading button image:", e);
                cleanup();
                return;
            }

            downloadBtn.className = "social-download-btn";
            downloadBtn.style.cssText = `
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: block;
                transition: transform 0.2s;
                opacity: 1;
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
            
            const mediaContainer = article.querySelector("._aagv") || 
                                 article.querySelector("._ab8w") ||
                                 article.querySelector("._aalb") ||
                                 article.querySelector("[role='button']");

            if (mediaContainer) {
                mediaContainer.style.cssText += `
                    position: relative !important;
                    display: block;
                `;
                
                const parentContainer = mediaContainer.closest("._aamf, ._aagv, ._ab8w");
                if (parentContainer) {
                    parentContainer.style.position = 'relative';
                }

                mediaContainer.appendChild(downloadContainer);
            }
        });
    } catch (error) {
        console.error("Error in addDownloadButton:", error);
        cleanup();
    }
}

downloadInterval = setInterval(addDownloadButton, 1000);

if (chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
        if (message === "contextInvalidated") {
            cleanup();
        }
    });
}

window.addEventListener('unload', cleanup);