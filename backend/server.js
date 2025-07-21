const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const shortid = require("shortid");

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = "mongodb+srv://jsingh2779048:Amandeep27@cluster0.ojuvvts.mongodb.net/textnest?retryWrites=true&w=majority&appName=Cluster0";

const allowedOrigins = [
  "http://localhost:3000",
  "https://chatapplication-seven-taupe.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGODB_URI).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  });

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const groupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  groupName: { type: String, required: true, unique: true },
  members: [String], // list of usernames
});
const Group = mongoose.model("Group", groupSchema);

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String, // username or groupId
  content: String,
  isGroup: Boolean,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// REST API

// Sign Up
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const user = await User.create({ username, password });
    res.json({ username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Username already taken" });
  }
});

// Sign In
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create new group
app.post("/group/create", async (req, res) => {
  const { groupName, username } = req.body;
  const groupId = shortid.generate();

  try {
    const newGroup = await Group.create({ 
      groupId, 
      groupName, 
      members: [username] 
    });
    res.status(201).json({ groupId, groupName });
  } catch (err) {
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Join group by name
app.post("/group/join", async (req, res) => {
  const { groupName, username } = req.body;

  try {
    const group = await Group.findOneAndUpdate(
      { groupName },
      { $addToSet: { members: username } },
      { new: true }
    );

    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json({ groupId: group.groupId, groupName: group.groupName });
  } catch (err) {
    res.status(500).json({ error: "Failed to join group" });
  }
});

// Get user messages (both personal and group)
app.get("/messages/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: username },
        { receiver: username }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("register", (username) => {
    socket.username = username;
    console.log(`${username} connected`);
  });

  // Personal message
  socket.on("sendPersonalMessage", async ({ sender, receiver, content }) => {
    const message = {
      sender,
      receiver,
      content,
      isGroup: false,
      timestamp: new Date(),
    };

    try {
      await Message.create(message);
      io.emit("receivePersonalMessage", message);
    } catch (err) {
      console.error("❌ Failed to store personal message", err);
    }
  });

  // Group message
// Update the socket.io group message handling
socket.on("sendGroupMessage", async ({ groupId, sender, content }) => {
  const message = {
    sender,
    receiver: groupId,
    content,
    isGroup: true,
    timestamp: new Date(),
  };

  try {
    // Save to database
    await Message.create(message);
    
    // Get all members in the group
    const group = await Group.findOne({ groupId });
    if (!group) return;

    // Emit to all members of the group
    group.members.forEach(member => {
      io.emit("receiveGroupMessage", {
        ...message,
        // Add group info for the frontend
        groupId,
        groupName: group.groupName
      });
    });
  } catch (err) {
    console.error("❌ Failed to store group message", err);
  }
});

// Update the joinGroup event
socket.on("joinGroup", async ({ groupId, username }) => {
  try {
    const group = await Group.findOne({ groupId });
    if (!group) return;

    socket.join(groupId);
    console.log(`${username} joined group ${groupId}`);

    // Send group info to the user
    socket.emit("groupInfo", {
      groupId,
      groupName: group.groupName
    });
  } catch (err) {
    console.error("Error joining group", err);
  }
});

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});