sessionStorage.screenSharingJSExtensionId = chrome.runtime.id;
let port;
let id;
chrome.runtime.sendMessage({ text: "getTabId" }, tab => {
    let port = chrome.extension.connect({
        name: "VTB Screensharing content"
    });
    id = tab.tab;
    port.postMessage(JSON.stringify({
        type: 'TAB_ID',
        id
    }));
    port.onMessage.addListener(function(msg) {
        const data = JSON.parse(msg);
        switch (data.type) {
            case 'LOCALE':
                const message = {
                    type: 'LOCALE',
                    locale: localStorage.locale || 'ru_RU',
                    id
                };
                port.postMessage(JSON.stringify(message));
                break;
        }
    });
    
});
