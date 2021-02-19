const socket = io('/');

const pc = new RTCPeerConnection();

socket.on('offer', async function(offer) {
    console.log("OFFER GET", offer);
    pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
    socket.emit('answer', answer);
})

socket.on('answer', async function(answer) {
    console.log("ANSWER GET", answer);
    pc.setRemoteDescription(answer);
})

socket.on('icecandidate', (candidate) => {
    console.log("icecandidate GET", candidate);
    if (candidate) {
        pc.addIceCandidate(candidate);
    }
})

window.addEventListener('load', async function() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true
        });
        handleSuccess(stream);
    } catch (e) {
        console.log(e)
    }
});

async function handleSuccess(stream) {
    console.log('Successfuly get media stream');

    pc.addEventListener('icecandidate', async function(event) {
        console.log('Sending icecandidate', event);
        socket.emit('icecandidate', event.candidate);
    })

    pc.addEventListener('track', (event) => {
        console.log('GET TRACK', event);
        const video = document.createElement('video');
        video.playsInline = true;
        video.autoplay = true;
        if (video.srcObject !== event.streams[0]) {
            video.srcObject = event.streams[0];
        }
        document.body.appendChild(video);
    })

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const video = document.createElement('video');
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = stream;
    document.body.appendChild(video);

    const offer = await pc.createOffer();
    console.log(offer);
    pc.setLocalDescription(offer);
    socket.emit('offer', offer);
}