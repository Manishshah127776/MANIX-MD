const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { startWebPairing } = require('./web-pair');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected to the pairing dashboard');
    socket.emit('status', 'Initializing WhatsApp connection...');
    
    // Start pairing process when a user connects
    startWebPairing(io);
});

server.listen(PORT, () => {
    console.log(`Pairing server is running on http://localhost:${PORT}`);
});
