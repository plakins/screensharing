const express = require('express');
const fs = require('fs');
const app = express();

var key = fs.readFileSync(__dirname + '/key.key');
var cert = fs.readFileSync(__dirname + '/crt.crt');
var options = {
  key: key,
  cert: cert
};

const server = require('https').Server(options, app);
const io = require('socket.io')(server);

server.listen(3000);

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('offer', (offer) => {
        console.log('OFFER');
        socket.join('main');
        socket.to('main').broadcast.emit('offer', offer);
    })
    socket.on('answer', (answer) => {
        console.log('ANSWER');
        socket.to('main').broadcast.emit('answer', answer);
    })
    socket.on('icecandidate', (candidate) => {
        console.log('CANDIDATE');
        socket.to('main').broadcast.emit('icecandidate', candidate);
    })
})