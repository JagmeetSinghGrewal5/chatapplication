import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import './App.css';

const BACKEND_URL = "https://textnest.onrender.com"; // ← Render backend URL
const socket = io(BACKEND_URL);

function App() {
  const [username, setUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    axios.get(`${BACKEND_URL}/messages`).then((res) => {
      setMessages(res.data);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [username]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close search on outside click or Esc
  useEffect(() => {
    if (!showSearch) return;
    function handleClick(e) {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") setShowSearch(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showSearch]);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/login`, { username: inputName });
      setUsername(res.data.username);
      socket.emit("join", inputName);
    } catch {
      alert("Username taken or invalid.");
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      const msg = { username, text: message };
      socket.emit("sendMessage", msg);
      setMessage("");
    }
  };

  // Filtered messages for search
  const filteredMessages = searchTerm
    ? messages.filter(
        (msg) =>
          msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  if (!username) {
    return (
      <div className="login-split-container">
        <div className="login-welcome-section">
          <div className="app-logo">TextNest</div>
          <h1 className="welcome-title">Connect<br/>friends<br/>easily &<br/>quickly</h1>
          <p className="welcome-desc">Our chat app is the perfect way to stay connected with friends and family.</p>
        </div>
        <div className="login-container">
          <h2 className="login-title">Login</h2>
          <form className="login-form" onSubmit={e => { e.preventDefault(); handleLogin(); }}>
            <input
              className="login-input"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter a unique username"
              autoFocus
            />
            <button className="login-button" type="submit">Enter Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-app-container ${theme}-theme`}>
      <div className="app-logo chat-logo-centered">TextNest</div>
      <div className="chat-header">
        <div className="chat-title">Welcome, {username}</div>
        <div className="chat-header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div
            className="search-icon-button"
            onClick={() => setShowSearch((v) => !v)}
            title="Find a previous chat"
          >
            <span className="search-icon" role="img" aria-label="search">🔍</span>
          </div>
          <div className="user-status">
            <span className="status-dot online"></span>
            User online
          </div>
        </div>
      </div>
      {showSearch && (
        <div className="chat-search-bar" ref={searchInputRef}>
          <input
            className="search-input"
            type="text"
            placeholder="Find a previous chat"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      )}
      <div className="chat-window">
        {filteredMessages.map((msg, i) => (
          <div key={i} className={`chat-message${msg.username === username ? " own-message" : ""}`}>
            <span className="chat-username">{msg.username}</span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
        <input
          className="chat-input"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message"
        />
        <button className="chat-send-button" type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
