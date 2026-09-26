const socket = io("http://konyha.site.je/");


// --------------------
// Elements
// --------------------

const loginScreen = document.getElementById("loginScreen");
const chatApp = document.getElementById("chatApp");

const usernameInput = document.getElementById("usernameInput");
const joinButton = document.getElementById("joinButton");

const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

const userList = document.getElementById("userList");
const onlineCount = document.getElementById("onlineCount");

const typing = document.getElementById("typing");

let username = "";


// --------------------
// Join chat
// --------------------

function joinChat() {

    const name = usernameInput.value.trim();

    if (!name) {
        alert("Please enter a username.");
        return;
    }

    username = name.slice(0, 20);

    socket.emit("join", username);

    loginScreen.classList.add("hidden");
    chatApp.classList.remove("hidden");

    messageInput.focus();
}


joinButton.addEventListener("click", joinChat);


// Press Enter to join
usernameInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        joinChat();
    }

});


// --------------------
// Send message
// --------------------

messageForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    socket.emit("chatMessage", message);

    messageInput.value = "";

    socket.emit("stopTyping");

});


// --------------------
// Receive message
// --------------------

socket.on("chatMessage", (data) => {

    const isMe = data.username === username;

    const message = document.createElement("div");

    message.className = isMe
        ? "message me"
        : "message";


    const content = document.createElement("div");

    content.className = "message-content";


    const usernameElement = document.createElement("div");

    usernameElement.className = "username";

    usernameElement.textContent = data.username;


    const bubble = document.createElement("div");

    bubble.className = "bubble";

    // textContent prevents users from injecting HTML
    bubble.textContent = data.message;


    const time = document.createElement("div");

    time.className = "time";

    time.textContent = data.time;


    content.appendChild(usernameElement);
    content.appendChild(bubble);
    content.appendChild(time);

    message.appendChild(content);

    messages.appendChild(message);


    // Scroll to bottom
    messages.scrollTop = messages.scrollHeight;

});


// --------------------
// System messages
// --------------------

socket.on("systemMessage", (message) => {

    const element = document.createElement("div");

    element.className = "system-message";

    element.textContent = message;

    messages.appendChild(element);

    messages.scrollTop = messages.scrollHeight;

});


// --------------------
// User list
// --------------------

socket.on("userList", (users) => {

    userList.innerHTML = "";

    users.forEach((user) => {

        const element = document.createElement("div");

        element.className = "user";

        element.innerHTML = `
            <span class="status"></span>
            ${escapeHTML(user)}
        `;

        userList.appendChild(element);

    });


    onlineCount.textContent =
        `${users.length} online`;

});


// --------------------
// Typing indicator
// --------------------

let typingTimeout;


messageInput.addEventListener("input", () => {

    socket.emit("typing");

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {

        socket.emit("stopTyping");

    }, 1000);

});


socket.on("userTyping", (user) => {

    typing.textContent = `${user} is typing...`;

});


socket.on("userStoppedTyping", () => {

    typing.textContent = "";

});


// --------------------
// Security helper
// --------------------

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}
