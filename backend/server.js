const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Get port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Configure CORS for production
const allowedOrigins = [
  "http://localhost:3000",
  "https://textnest.onrender.com",
  "https://textnest.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// In-memory storage
const users = {};
const messages = [];

// REST endpoint for login
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username || users[username]) {
    return res.status(400).json({ error: "Invalid or already used username" });
  }
  users[username] = true;
  res.json({ username });
});

// Get chat history
app.get("/messages", (req, res) => {
  res.json(messages);
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (username) => {
    socket.username = username;
    console.log(`${username} joined the chat`);
  });

  socket.on("sendMessage", (data) => {
    messages.push(data); // Save to memory
    io.emit("receiveMessage", data); // Broadcast
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log("🌐 Production mode enabled");
  } else {
    console.log("🔧 Development mode - Backend running at http://localhost:5000");
  }
});
