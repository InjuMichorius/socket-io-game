const path = require('path');
const { Server } = require('socket.io');
const { createServer } = require('http');
const express = require('express');

const { shuffleWord } = require('./utils/shuffleWord');
const { getRandomWordWithHint } = require('./utils/getRandomWordWithHint');

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
const botName = "Scramble master";
let refreshInterval
let randomWord
// Map to store room states (whether a game is in progress)
const roomStates = new Map();

// Function to start the game for a room
function startGame(room) {
  roomStates.set(room, true); // Set room state to indicate game in progress
  const emitRandomWord = () => {
    const { randomWord: newRandomWord, randomHint } = getRandomWordWithHint();
    randomWord = newRandomWord; // Update the value of randomWord
    let shuffledWord = shuffleWord(randomWord);
    ioServer.to(room).emit("randomWord", shuffledWord);
  };

  // Refresh the random word every 5 seconds
  refreshInterval = setInterval(emitRandomWord, 10000);

  // Stop the game after 2 minutes (optional)
  setTimeout(() => {
    clearInterval(refreshInterval);
    roomStates.delete(room); // Clear room state after game ends
  }, 2 * 60 * 1000);
}

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

    // Check if the room has an ongoing game
    if (!roomStates.has(room)) {
      // Start the game for the first player
      startGame(room);
    }
  });

  client.on('message', (message) => {
    const user = getCurrentUser(client.id);

    if (message.toLowerCase() === randomWord) {
      user.points += 100;
      ioServer.to(user.room).emit("message", formatMessage(user.username, ' has guessed the word!'));
      ioServer.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    } else {
      ioServer.to(user.room).emit("message", formatMessage(user.username, message));
    }
  });

  //on disconnect
  client.on("disconnect", () => {
    console.log(`user ${client.id} connected`);
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
    //TODO: figure out this questionable code
    clearInterval(refreshInterval);
  });

});

// Start the http server
http.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});
