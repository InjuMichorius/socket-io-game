const path = require('path');
const { Server } = require('socket.io');
const { createServer } = require('http');
const express = require('express');

const { getRandomWordWithHint } = require('./utils/getRandomWord');
const { randomWord, randomHint } = getRandomWordWithHint();

const formatMessage = require('./utils/formatMessage')
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const http = createServer(app);
const ioServer = new Server(http, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});
const port = process.env.PORT || 4242;
const botName = "Scramble master"

// Serve static files from the "public" directory
app.use(express.static(path.resolve(__dirname, 'public')));

// Serve the index.html file for the root path
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the socket.io server
ioServer.on('connection', (client) => {
  console.log(`user ${client.id} connected`);

  client.on("joinRoom", ({ username, room }) => {
    const user = userJoin(client.id, username, room);

    client.join(user.room);

    // Welcome current user
    client.emit("message", formatMessage(botName, "Welcome to wordscrambler!"));

    // Broadcast when a user connects
    client.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    ioServer.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  client.on('message', (message) => {
    const user = getCurrentUser(client.id);
    console.log(randomWord)
    if (message === randomWord) {
      ioServer.to(user.room).emit("message", formatMessage(user.username, ' has guessed the word!'));
    } else {
      ioServer.to(user.room).emit("message", formatMessage(user.username, message));
    }
  });

  //on disconnect
  client.on("disconnect", () => {
    const user = userLeave(client.id);

    if (user) {
      ioServer.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      ioServer.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

});

// Start the http server
http.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});
