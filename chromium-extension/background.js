/* background page, responsible for actually choosing media */
chrome.runtime.onMessageExternal.addListener(function (message, sender, callback) {
    switch(message.type) {
        case 'getTabCature':
            var pending = chrome.tabCapture.getMediaStreamId(
                { consumerTabId: sender.tab.id, targetTabId: sender.tab.id },
                function (streamId) {
                    message.type = 'gotTabCature';
                    message.sourceId = streamId;
                    callback(message);
                    return false;
                }
            );
            return true; // retain callback for chooseDesktopMedia result
        case 'cancelGetScreen':
            chrome.desktopCapture.cancelChooseDesktopMedia(message.request);
            message.type = 'canceledGetScreen';
            callback(message);
            return false; //dispose callback
    }
});
