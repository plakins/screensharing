/* background page, responsible for actually choosing media */
const allowedTabs = {};

chrome.runtime.onMessageExternal.addListener(function (message, sender, callback) {
    switch(message.type) {
        case 'getTabCature':
            if (!allowedTabs[sender.tab.id]) {
                return callback({
                    type: 'notAllowed'
                })
            }
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

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.text == "getTabId") {
        sendResponse({tab: sender.tab.id});
    }
});


let popupPort;
let contentPort = {};

chrome.extension.onConnect.addListener(function(port) {
    if (port.name === 'VTB Screensharing') {
        popupPort = port;
        port.onMessage.addListener(function(data) {
            const message = JSON.parse(data);
    
            switch (message.type) {
                case 'IS_ALLOWED':
                    if (!allowedTabs[message.id]) {
                        allowedTabs[message.id] = false;
                    }
                    const msg = {
                        type: 'IS_ALLOWED',
                        id: message.id,
                        value: allowedTabs[message.id]
                    }
    
                    port.postMessage(JSON.stringify(msg));
                    break;
                case 'CHANGE':
                    allowedTabs[message.id] = message.value;
                    break;

                case 'LOCALE':
                    if (contentPort[message.id]) {
                        const msg = {
                            type: 'LOCALE'
                        }
                        contentPort[message.id].postMessage(JSON.stringify(msg));
                    } else {
                        const msg = {
                            type: 'LOCALE',
                            value: 'ru_RU'
                        }
                        port.postMessage(JSON.stringify(msg));
                    }
            }
        });
    }

    if (port.name === 'VTB Screensharing content') {
        port.onMessage.addListener(function(data) {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'TAB_ID':
                    contentPort[message.id] = port;
                    break;
                case 'LOCALE':
                    if (popupPort) {
                        const msg = {
                            type: 'LOCALE',
                            value: message.locale
                        }
                        popupPort.postMessage(JSON.stringify(msg));
                    }
                    break;
            }
        });
    }
})