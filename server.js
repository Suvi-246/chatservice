const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://konyha.site.je",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve everything inside /public
app.use(express.static("public"));

const users = new Map();

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // User joins
    socket.on("join", (username) => {
        username = String(username).trim().slice(0, 20);

        if (!username) {
            username = "Anonymous";
        }

        users.set(socket.id, username);

        // Tell everyone about the new user
        io.emit("systemMessage", `${username} joined the chat.`);

        // Send updated user list
        io.emit("userList", Array.from(users.values()));

        console.log(`${username} joined.`);
    });

    // Receive a chat message
    socket.on("chatMessage", (message) => {
        const username = users.get(socket.id);

        if (!username) return;

        message = String(message).trim();

        if (!message) return;

        // Limit messages to 500 characters
        message = message.slice(0, 500);

        io.emit("chatMessage", {
            username: username,
            message: message,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        });
    });

    // Typing indicator
    socket.on("typing", () => {
        const username = users.get(socket.id);

        if (username) {
            socket.broadcast.emit("userTyping", username);
        }
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("userStoppedTyping");
    });

    // User disconnects
    socket.on("disconnect", () => {
        const username = users.get(socket.id);

        if (username) {
            users.delete(socket.id);

            io.emit("systemMessage", `${username} left the chat.`);

            io.emit("userList", Array.from(users.values()));

            console.log(`${username} disconnected.`);
        }
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Chatroom running on port ${PORT}`);
});
