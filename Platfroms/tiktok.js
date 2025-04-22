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
  document.querySelectorAll(".social-download-btn").forEach((btn) => {
    btn.remove();
  });
}

function extractMediaUrls(container) {
  const mediaUrls = [];

  // Image handling only for TikTok
  const imageElements = container.querySelectorAll(
    'img[src*="tiktokcdn"], img[src*="tiktok.com"][src*="image"]'
  );
  imageElements.forEach((img) => {
    const url = img.src;
    // Filter out avatar images and other non-content images
    if (
      url &&
      !url.includes("avatar") &&
      !url.includes("music-cover") &&
      !mediaUrls.some((m) => m.url === url)
    ) {
      mediaUrls.push({
        url: url,
        isWebP: url.toLowerCase().includes(".webp"),
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
        filename: `tiktok-image-${Date.now()}-${index + 1}${
          media.isWebP ? ".webp" : ".jpg"
        }`,
        isWebP: media.isWebP,
        platform: "tiktok",
      });
    });
  } catch (e) {
    console.error("Download error:", e);
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
    downloadBtn.src = chrome.runtime.getURL("icon/download_tiktok.jpeg");
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

  downloadBtn.addEventListener("mouseover", () => {
    downloadBtn.style.transform = "scale(1.1)";
  });

  downloadBtn.addEventListener("mouseout", () => {
    downloadBtn.style.transform = "scale(1)";
  });

  downloadBtn.addEventListener("click", () => {
    handleDownload(mediaUrls);
  });

  downloadContainer.appendChild(downloadBtn);

  // Make sure container is relative for absolute positioning
  const parentStyle = window.getComputedStyle(container);
  if (parentStyle.position === "static") {
    container.style.position = "relative";
  }

  container.appendChild(downloadContainer);
}

function scanPage() {
  if (!checkContextValidity()) {
    cleanup();
    return;
  }

  try {
    // Scan for image containers in TikTok
    const imageContainers = document.querySelectorAll(
      ".tiktok-1sp9o9c-ImgPoster, .tiktok-1itcwxg-ImgPoster"
    );
    imageContainers.forEach((container) => {
      if (!container.querySelector(".social-download-btn")) {
        addDownloadButton(container);
      }
    });

    // Also check for lightbox/modal images
    const modalImages = document.querySelectorAll(
      ".tiktok-1p23b18-ImgContainer img"
    );
    modalImages.forEach((img) => {
      const container = img.closest(".tiktok-1p23b18-ImgContainer");
      if (container && !container.querySelector(".social-download-btn")) {
        addDownloadButton(container);
      }
    });
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

window.addEventListener("unload", cleanup);
