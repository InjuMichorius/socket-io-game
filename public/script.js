let ioServer = io();
let messages = document.querySelector("section #chat-box");
let input = document.querySelector("input");

// State messages
const loadingState = document.querySelector("span.loading");
const emptyState = document.querySelector("span.empty");
const errorState = document.querySelector("span.offline");

const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Get username and room from URL
const params = new URLSearchParams(window.location.search);
const username = params.get("username");
const room = params.get("room");

// Join chatroom
ioServer.emit("joinRoom", { username, room });

// Get room and users
ioServer.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Listen for the "randomWord" event from the server
ioServer.on("randomWord", (scrambledRandomWord) => {
  // Display the random word received from the server
  initGeneratedWord(scrambledRandomWord);
  console.log(scrambledRandomWord);
});

// Function to display the random word on the client side
function initGeneratedWord(scrambledRandomWord) {
  const wordContainer = document.getElementById("word-container");

  // Clear the contents of the wordContainer
  wordContainer.innerHTML = "";

  scrambledRandomWord.forEach((letter) => {
    const letterElement = document.createElement("li");
    letterElement.classList.add("letter-wrapper");
    letterElement.textContent = letter;
    wordContainer.appendChild(letterElement);
  });
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    console.log(user)
    const li = document.createElement("li");
    li.innerText = user.username + user.points;
    userList.appendChild(li);
  });
}

// Luister naar het submit event
document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();

  // Als er überhaupt iets getypt is
  if (input.value) {
    // Stuur het bericht naar de server
    ioServer.emit("message", input.value);

    // Leeg het form field
    input.value = "";
  }
});

// Luister naar berichten van de server
ioServer.on("message", (message) => {
  loadingState.style.display = "none";
  emptyState.style.display = "none";
  addMessage(message);
});

// Er gaat iets mis bij het verbinden
ioServer.io.on("error", (error) => {
  loadingState.style.display = "none";
  emptyState.style.display = "none";
  errorState.style.display = "inline";
});

// Poging om opnieuw te verbinden
ioServer.on("reconnect_attempt", (attempt) => {
  console.log("attempting reconnection");
});

// Verbinding geslaagd
ioServer.on("reconnect", (attempt) => {
  loadingState.style.display = "none";
  emptyState.style.display = "none";
  errorState.style.display = "none";
});

// Als het reconnecten niet goed gaat
ioServer.on("reconnect_error", (error) => {
  // Handle reconnect error here
});

// Reconnecten is een aantal keer (reconnectionAttempts) geprobeerd en faalt
// het reconnecten stopt, misschien handig voor een 'probeer opnieuw' knop.
ioServer.on("reconnect_failed", () => {
  // Handle reconnect failure here
});

function addMessage(message) {
  // messages.appendChild(
  //   Object.assign(document.createElement("li"), { textContent: message })
  // );
  const messageElement = document.createElement("li");
  messageElement.classList.add("message-container");
  messageElement.innerHTML = `<p><b>${message.username}: </b>${message.text}<p><span class="time">${message.time}</span>`;
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
}
