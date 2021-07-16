let id;
let locale = 'ru_RU';
const dictionary = {
    'ru_RU': {
        title: 'Разрешить демонстрацию экрана',
        text: 'Для демонстрации экрана будет доступна только текущая вкладка браузера',
        logo: './logo-ru_RU.svg'
    },
    'en_US': {
        title: 'Allow screen sharing',
        text: 'Only the current browser tab will be available for the screen sharing',
        logo: './logo-en_US.svg'
    }
}
let port = chrome.extension.connect({
    name: "VTB Screensharing"
});

function show() {
    const mask = document.getElementById('mask');
    if (dictionary[locale]) {
        const title = document.getElementById('title');
        const text = document.getElementById('text');
        const logo = document.getElementById('logo');
        title.innerText = dictionary[locale].title;
        text.innerText = dictionary[locale].text;
        logo.src = dictionary[locale].logo;
    }
    mask.style.display = 'none'
}

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
            break;
        case 'LOCALE':
            locale = data.value;
            show()
            break;
    }
});

chrome.tabs.query( { active: true, currentWindow: true }, (data) => {
    id = data[0].id;
    port.postMessage(JSON.stringify({
        type: 'IS_ALLOWED',
        id: data[0].id
    }));
    port.postMessage(JSON.stringify({
        type: 'LOCALE',
        id: data[0].id
    }));
});