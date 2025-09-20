require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB ✅'))
    .catch(err => console.error('Connection error', err));

// All your models and Socket.IO logic go here...

// This line MUST be correct. It tells Express where to find your HTML files.
app.use(express.static(path.join(__dirname, 'public')));

// All your app.get and app.post routes go here...

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});