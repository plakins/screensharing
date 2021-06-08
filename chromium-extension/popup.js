let id;
let port = chrome.extension.connect({
    name: "VTB Screensharing"
});

document.getElementById('toggle').addEventListener('change', function(e) {
    const message = {
        type: 'CHANGE',
        id,
        value: e.target.checked
    };
    port.postMessage(JSON.stringify(message));
})


port.onMessage.addListener(function(msg) {
    const data = JSON.parse(msg);
    switch (data.type) {
        case 'IS_ALLOWED':
            if (data.id === id) {
                document.getElementById('toggle').checked = data.value;
            }
    }
});

chrome.tabs.query( { active: true, currentWindow: true }, (data) => {
    id = data[0].id;
    const message = {
        type: 'IS_ALLOWED',
        id: data[0].id
    }
    port.postMessage(JSON.stringify(message));
});