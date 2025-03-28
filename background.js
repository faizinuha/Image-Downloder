chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.action === "download") {
        if (request.isWebP) {
            fetch(request.url, {
                mode: 'no-cors',
                credentials: 'omit'
            })
            .then(_response => {
                // Direct download since we can't process no-cors response
                chrome.downloads.download({
                    url: request.url,
                    filename: request.filename.replace('.png', '.webp'),
                    conflictAction: 'uniquify'
                });
            })
            .catch(error => {
                chrome.downloads.download({
                    url: request.url,
                    filename: request.filename.replace('.png', '.webp'),
                    conflictAction: 'uniquify'
                });
            });
        } else {
            chrome.downloads.download({
                url: request.url,
                filename: request.filename,
                conflictAction: 'uniquify'
            });
        }
    }
});