import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

const socket = io("http://localhost:5000");
const API_BASE = "http://localhost:5000";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoggedIn) return;

    socket.on("receivePersonalMessage", (data) => {
      if (data.sender === selectedUser || data.receiver === selectedUser) {
        setMessages(prev => [...prev, data]);
      }
    });

    socket.on("receiveGroupMessage", (data) => {
      if (data.receiver === groupId) {
        setMessages(prev => [...prev, data]);
      }
    });

    return () => {
      socket.off("receivePersonalMessage");
      socket.off("receiveGroupMessage");
    };
  }, [isLoggedIn, selectedUser, groupId]);

  const handleSignup = async () => {
    try {
      await axios.post(`${API_BASE}/signup`, { username, password });
      alert("Signup successful! Please login.");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  const handleSignin = async () => {
    try {
      await axios.post(`${API_BASE}/signin`, { username, password });
      setIsLoggedIn(true);
      socket.emit("register", username);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data.filter(user => user.username !== username));
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchMessages = async (receiver) => {
    try {
      const res = await axios.get(`${API_BASE}/messages/${username}`);
      setMessages(res.data.filter(msg => 
        (msg.sender === receiver || msg.receiver === receiver) ||
        (msg.receiver === groupId && activeTab === "group")
      ));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const createGroup = async () => {
    const name = prompt("Enter group name:");
    if (!name) return;
    
    try {
      const res = await axios.post(`${API_BASE}/group/create`, { 
        groupName: name,
        username 
      });
      setGroupId(res.data.groupId);
      setGroupName(res.data.groupName);
      alert(`Group created: ${res.data.groupName}`);
      setActiveTab("group");
      fetchMessages(res.data.groupId);
    } catch (err) {
      alert(err.response?.data?.error || "Group creation failed");
    }
  };

  const joinGroup = async () => {
    const name = prompt("Enter group name:");
    if (!name) return;
    
    try {
      const res = await axios.post(`${API_BASE}/group/join`, {
        groupName: name,
        username
      });
      setGroupId(res.data.groupId);
      setGroupName(res.data.groupName);
      setActiveTab("group");
      fetchMessages(res.data.groupId);
    } catch (err) {
      alert(err.response?.data?.error || "Join group failed");
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    
    if (activeTab === "users" && selectedUser) {
      socket.emit("sendPersonalMessage", {
        sender: username,
        receiver: selectedUser,
        content: message
      });
    } else if (activeTab === "group" && groupId) {
      socket.emit("sendGroupMessage", {
        groupId,
        sender: username,
        content: message
      });
    }
    
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user.username);
    setActiveTab("users");
    fetchMessages(user.username);
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h1>TextNest Chat</h1>
        <div className="auth-form">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="auth-buttons">
            <button onClick={handleSignin}>Sign In</button>
            <button onClick={handleSignup}>Sign Up</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TextNest Chat - {username}</h1>
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
      </header>

      <div className="main-content">
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Users</h3>
            <ul>
              {users.map(user => (
                <li 
                  key={user.username} 
                  className={selectedUser === user.username ? "active" : ""}
                  onClick={() => selectUser(user)}
                >
                  {user.username}
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Groups</h3>
            <button onClick={createGroup}>Create Group</button>
            <button onClick={joinGroup}>Join Group</button>
            {groupName && (
              <div 
                className={`group-item ${activeTab === "group" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("group");
                  fetchMessages(groupId);
                }}
              >
                {groupName}
              </div>
            )}
          </div>
        </div>

        <div className="chat-area">
          <div className="chat-header">
            {activeTab === "users" ? (
              <h2>{selectedUser || "Select a user to chat"}</h2>
            ) : (
              <h2>Group: {groupName || "No group selected"}</h2>
            )}
          </div>

          <div className="messages-container">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`message ${msg.sender === username ? "sent" : "received"}`}
              >
                <span className="sender">{msg.sender}: </span>
                <span className="content">{msg.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input">
            <input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!selectedUser && activeTab === "users" && !groupId}
            />
            <button 
              onClick={sendMessage}
              disabled={!message || (activeTab === "users" && !selectedUser) || (activeTab === "group" && !groupId)}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}