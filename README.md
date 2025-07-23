# TextNest - Live Chat Application

A real-time chat application built with React frontend and Node.js backend using Socket.IO.

## 🚀 Live Demo

- **Frontend**: https://textnest.vercel.app/
- **Backend API**: https://textnest.onrender.com

## 🛠️ Local Development Setup

### Backend Setup
1. Load the "LIVE-CHAT-APP" folder in VSCode
2. Press "ctrl+`" to open terminal
3. Navigate to backend: `cd backend`
4. Install dependencies: `npm install`
5. Start the server: `node server.js`
6. Backend will run at http://localhost:5000

### Frontend Setup
1. Open a new terminal
2. Navigate to frontend: `cd frontend`
3. Install dependencies: `npm install`
4. Start the development server: `npm start`
5. Frontend will run at http://localhost:3000  https://chatapplication-seven-taupe.vercel.app/

## 🌐 Production Deployment

### Backend (Render)
The backend is deployed on Render at: https://textnest.onrender.com

### Frontend Configuration
The frontend is already configured to use the deployed backend. The `BACKEND_URL` in `frontend/src/App.js` is set to:
```javascript
const BACKEND_URL = "https://textnest.onrender.com";
```

## 📱 Features

- Real-time messaging
- User authentication
- Message history
- Search functionality
- Dark/Light theme toggle
- Responsive design
- Online user status

## 🛠️ Tech Stack

- **Frontend**: React, Socket.IO Client, Axios
- **Backend**: Node.js, Express, Socket.IO
- **Deployment**: Render

## 🔧 Environment Variables

The backend uses the following environment variables:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

## 📝 API Endpoints

- `POST /login` - User login
- `GET /messages` - Get chat history
- `GET /health` - Health check

## 🔌 Socket.IO Events

- `join` - User joins chat
- `sendMessage` - Send a message
- `receiveMessage` - Receive a message


Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.

SCREENSHOTS
![image](https://github.com/user-attachments/assets/34ff3805-2cac-48b0-847a-b9c4c99a77f8)
![image](https://github.com/user-attachments/assets/7fda9ad8-693a-46c4-997e-2be2e3e1023e)
![image](https://github.com/user-attachments/assets/a6d9dc13-2ce1-4fe2-a4e5-73dedd9e50fb)
