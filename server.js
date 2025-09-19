require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB ✅'))
    .catch(err => console.error('Connection error', err));

const Result = mongoose.model('Result', new mongoose.Schema({
    candidateId: String, score: Number, total: Number, submittedAt: { type: Date, default: Date.now }
}));

let activeCandidates = 0;
let waitingInterns = {};

io.on('connection', (socket) => {
    activeCandidates++;
    io.emit('update-count', activeCandidates);
    io.emit('update-waiting-list', waitingInterns);
    console.log(`SERVER: User connected (${socket.id}). Active users: ${activeCandidates}`);

    socket.on('intern-waiting', (data) => {
        waitingInterns[socket.id] = { name: data.name };
        io.emit('update-waiting-list', waitingInterns);
    });

    socket.on('admit-intern', (data) => {
        io.to(data.socketId).emit('permission-granted');
        delete waitingInterns[data.socketId];
        io.emit('update-waiting-list', waitingInterns);
    });

    socket.on('offer-from-intern', (data) => {
        socket.broadcast.emit('offer-for-admin', { offer: data.offer, from: socket.id, name: data.name });
    });

    socket.on('answer-from-admin', (data) => {
        io.to(data.to).emit('answer-for-intern', data.answer);
    });

    socket.on('ice-candidate-from-intern', (data) => {
        socket.broadcast.emit('ice-candidate-for-admin', { candidate: data.candidate, from: socket.id });
    });
    
    socket.on('ice-candidate-from-admin', (data) => {
        io.to(data.to).emit('ice-candidate-for-intern', data.candidate);
    });

    socket.on('disconnect', () => {
        activeCandidates--;
        io.emit('update-count', activeCandidates);
        delete waitingInterns[socket.id];
        io.emit('update-waiting-list', waitingInterns);
        io.emit('user-disconnected', socket.id);
        console.log(`SERVER: User disconnected (${socket.id}). Active users: ${activeCandidates}`);
    });
});

app.use(express.json());

// This serves all HTML files from the public folder.
app.use(express.static(path.join(__dirname, 'public')));

// This redirect handles the root URL.
app.get('/', (req, res) => {
    res.redirect('/admin.html');
});

// Your API routes for saving and getting scores
app.post('/api/results', async (req, res) => { try { const newResult = new Result({ candidateId: req.body.candidateId, score: req.body.score, total: req.body.total }); await newResult.save(); res.status(201).send({ message: 'Result saved successfully!' }); } catch (error) { res.status(500).send({ message: 'Error saving result' }); } });
app.get('/api/results', async (req, res) => { try { const results = await Result.find({}).sort({ submittedAt: -1 }); res.json(results); } catch (error) { res.status(500).send({ message: 'Error fetching results' }); } });

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});