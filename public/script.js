var ws = new WebSocket('wss://' + location.host + '/one2many');

const options = {
    iceServers: [
        { urls: "stun:178.49.101.108:3478" },
        { urls: "stun:stun.l.google.com:19302" }
    ]
};
let pc = new RTCPeerConnection(options);

window.addEventListener('load', async function() {
    document.getElementById('presentor').addEventListener('click', presentor);
    document.getElementById('viewer').addEventListener('click', viewer);
    document.getElementById('stop').addEventListener('click', stop );
    document.getElementById('fullscrean').addEventListener('click', fullscrean)
});

window.addEventListener('beforeunload', function() {
	ws.close();
});

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);
	switch (parsedMessage.id) {
	case 'presenterResponse':
		handleAnswer(parsedMessage);
		break;
	case 'viewerResponse':
		handleAnswer(parsedMessage);
		break;
    case 'stopCommunication':
        dispose();
        break;
	case 'iceCandidate':
        handleAddIceCandidate(parsedMessage);
		break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}

function handleAnswer(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.warn('Call not accepted for the following reason: ' + errorMsg);
        dispose();
	} else {
        const answer = new RTCSessionDescription({
            type: 'answer',
            sdp: message.sdpAnswer
        });
	}
}

const addIceCandidate = bufferizeCandidates(pc, console.log);
function handleAddIceCandidate(message) {
    const candidate = new RTCIceCandidate(message.candidate)
    addIceCandidate(candidate);
}

function presentor() {
    getMedia(handleGetMedia);
}

async function handleGetMedia(error, stream) {
    if (error) {
        console.error(error);
        if (error.name === 'NotAllowedError') {
            alert('Дайте доступ расширению');
            return;
        }
        return;
    }

    setButtonsDisableState(true);
    document.getElementById('video').srcObject = stream;

    if (!pc) {
        pc = new RTCPeerConnection();
    }

    pc.addEventListener('icecandidate', onIceCandidate);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.getTransceivers().forEach(function (transceiver) {
        transceiver.direction = 'sendonly';
    });
      
    const offer = await pc.createOffer();
    pc.setLocalDescription(offer);
    var message = {
		id : 'presenter',
		sdpOffer : offer.sdp
	}
	sendMessage(message);
}

async function viewer() {
    setButtonsDisableState(true);

    if (!pc) {
        pc = new RTCPeerConnection();
    }

    pc.addEventListener('icecandidate', onIceCandidate);

    pc.addEventListener('track', (event) => {
        console.log('GET TRACK', event);
        const video = document.getElementById('video');
        if (video.srcObject !== event.streams[0]) {
            video.srcObject = event.streams[0];
        }
    });

    pc.addTransceiver('video', { direction: 'recvonly' });

    const offer = await pc.createOffer();
    console.log('Offer from viewer', offer);
    pc.setLocalDescription(offer);
    var message = {
		id : 'viewer',
		sdpOffer : offer.sdp
	}
	sendMessage(message);
}

function onIceCandidate(event) {
    const { candidate } = event;
    if (!candidate) return;
    console.log('Local candidate ' + JSON.stringify(candidate));
    var message = {
        id : 'onIceCandidate',
        candidate : candidate
    }
    sendMessage(message);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Sending message: ' + jsonMessage);
	ws.send(jsonMessage);
}

function bufferizeCandidates(pc, onerror) {
    var candidatesQueue = [];
    var signalingstatechangeFunction = function () {
        if (pc.signalingState === 'stable') {
            while (candidatesQueue.length) {
                var entry = candidatesQueue.shift();
                pc.addIceCandidate(entry.candidate, entry.callback, entry.callback);
            }
        }
    };

    pc.addEventListener('signalingstatechange', signalingstatechangeFunction);

    return function (candidate, callback) {
        callback = callback || onerror;
        switch (pc.signalingState) {
        case 'closed':
            callback(new Error('PeerConnection object is closed'));
            break;
        case 'stable':
            if (pc.remoteDescription) {
                pc.addIceCandidate(candidate, callback, callback);
                break;
            }
        default:
            candidatesQueue.push({
                candidate: candidate,
                callback: callback
            });
        }
    };
}

function getMedia(callback) {
    if (!sessionStorage.screenSharingJSExtensionId) {
        alert('Установите расширение');
        return;
    }
    chrome.runtime.sendMessage(
        sessionStorage.screenSharingJSExtensionId,
        {type: 'getTabCature', id: 1, options: ['tab']},
        null,
        async function (data) {
            console.log('Extenstion returned data', data);
            if (!data || !data.sourceId) { // user canceled
                var error = new Error('NavigatorUserMediaError');
                error.name = 'NotAllowedError';
                callback(error);
            } else {
                constraints = {audio: false, video: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        maxWidth: window.screen.width,
                        maxHeight: window.screen.height
                    }
                }};
                constraints.video.mandatory.chromeMediaSourceId = data.sourceId;
                try {
                    const stream = await window.navigator.mediaDevices.getUserMedia(constraints);
                    callback(null, stream);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    );
}

function fullscrean() {
    const video = document.getElementById('video');
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { 
        video.msRequestFullscreen();
    }
}

function setButtonsDisableState(value) {
    document.getElementById('viewer').disabled = value;
    document.getElementById('presentor').disabled = value;
}

function stop() {
	if (pc) {
		var message = { id : 'stop' }
		sendMessage(message);
		dispose();
	}
}

function trackStop(track) {
    track.stop && track.stop();
}
function streamStop(stream) {
    stream.getTracks().forEach(trackStop);
}

function dispose() {
    console.log('Disposing WebRtcPeer');
    try {
        if (pc) {
            if (pc.signalingState === 'closed')
                return;
            pc.getLocalStreams().forEach(streamStop);
            pc.close();
            pc = null;
            document.getElementById('video').srcObject = null;
            setButtonsDisableState(false);
        }
    } catch (err) {
        console.warn('Exception disposing webrtc peer ' + err);
    }
};