const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("http");
const express = require("express");

const { shuffleWord } = require("./utils/shuffleWord");
const { getRandomWordWithHint } = require("./utils/getRandomWordWithHint");

const formatMessage = require("./utils/formatMessage");
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
let randomWord;
let wordGuessCount;

// Serve static files from the "public" directory
app.use(express.static(path.resolve(__dirname, "public")));

// Serve the index.html file for the root path
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// Start the socket.io server
ioServer.on("connection", (client) => {
  console.log(`user ${client.id} connected`);

  client.on("joinRoom", ({ username, room }) => {
    const emitRandomWord = () => {
      const { randomWord: newRandomWord, randomHint } = getRandomWordWithHint();
      randomWord = newRandomWord; // Update the value of randomWord
      let shuffledWord = shuffleWord(randomWord);
      console.log(shuffledWord);
      wordGuessCount = 0;
      ioServer.to(room).emit("randomWord", shuffledWord);
    };
    //Start game by refreshing the random word every 5 seconds
    if (getRoomUsers(room).length === 0) {
      refreshInterval = setInterval(emitRandomWord, 8000);
    }
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
    const roomUsers = getRoomUsers(user.room);
    // Send users and room info
    ioServer.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
    // console.log(`Number of users in room ${user.room}: ${roomUsers.length}`);
  });

  client.on("message", (message) => {
    const user = getCurrentUser(client.id);

    if (message.toLowerCase() === randomWord) {
      wordGuessCount += 1;
      if (wordGuessCount === 1) {
        user.points += 100;
      } else if (wordGuessCount === 2) {
        user.points += 90;
      } else if (wordGuessCount === 3) {
        user.points += 80;
      } else if (wordGuessCount === 4) {
        user.points += 70;
      } else if (wordGuessCount === 5) {
        user.points += 60;
      } else if (wordGuessCount === 6) {
        user.points += 50;
      } else if (wordGuessCount === 7) {
        user.points += 40;
      }
      ioServer
        .to(user.room)
        .emit(
          "message",
          formatMessage(user.username, " has guessed the word!")
        );
      ioServer.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    } else {
      ioServer
        .to(user.room)
        .emit("message", formatMessage(user.username, message));
    }
  });

  // Handle disconnect event
  client.on("disconnect", () => {
    console.log(`user ${client.id} disconnected`);
    const user = userLeave(client.id);

    if (user) {
      ioServer
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
      const roomUsers = getRoomUsers(user.room);
      if (roomUsers.length === 0) {
        // Stop refreshing the random word every 5 seconds
        clearInterval(refreshInterval);
      }

      // Send users and room info
      ioServer.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

      // Log the number of users in the room after user leaves
      // console.log(`Number of users in room ${user.room}: ${roomUsers.length}`);
    }
  });
});

// Start the http server
http.listen(port, () => {
  console.log("listening on http://localhost:" + port);
});
