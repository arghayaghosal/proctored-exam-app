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

app.use(express.json());

// Add this route to handle requests for the root URL
app.get('/', (req, res) => {
    res.redirect('/admin.html');
});

// This serves all your HTML files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Your API routes go here...

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
);