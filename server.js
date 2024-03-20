const path = require('path');
const { Server } = require('socket.io');
const { createServer } = require('http');
const express = require('express');

const app = express();
const http = createServer(app);
const ioServer = new Server(http, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});
const port = process.env.PORT || 4242;
const historySize = 50;

let history = [];

// Serve static files from the "public" directory
app.use(express.static(path.resolve(__dirname, 'public')));

// Serve the index.html file for the root path
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the socket.io server
ioServer.on('connection', (client) => {
  console.log(`user ${client.id} connected`);
  client.emit('history', history);

  client.on('message', (message) => {
    while (history.length > historySize) {
      history.shift();
    }
    history.push(message);
    ioServer.emit('message', message);
  });

  client.on('disconnect', () => {
    console.log(`user ${client.id} disconnected`);
  });
});

// Start the http server
http.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});
