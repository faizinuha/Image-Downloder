chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.action === "download") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            conflictAction: 'uniquify'
        });
    }
});