require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exam-app';

// Temporary in-memory storage if MongoDB is not available
let inMemoryResults = [];

if (process.env.MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('Successfully connected to MongoDB ✅'))
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.log('Running with in-memory storage. Results will not persist.');
        });
} else {
    console.log('No MONGO_URI found. Running with in-memory storage. Results will not persist.');
    console.log('To use persistent storage, add your MongoDB connection string as MONGO_URI secret.');
}

const Result = mongoose.model('Result', new mongoose.Schema({
    candidateId: String, score: Number, total: Number, submittedAt: { type: Date, default: Date.now }
}));

let activeCandidates = 0;
let waitingInterns = {};

io.on('connection', (socket) => {
    console.log(`🔗 New Socket.IO connection: ${socket.id}`);
    activeCandidates++;
    console.log(`👥 Active candidates: ${activeCandidates}`);
    io.emit('update-count', activeCandidates);
    io.emit('update-waiting-list', waitingInterns);
    
    socket.on('intern-waiting', (data) => {
        console.log(`⏳ Intern joining waiting room: ${data.name} (${socket.id})`);
        waitingInterns[socket.id] = { name: data.name };
        console.log(`📋 Updated waiting list:`, waitingInterns);
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
    });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/admin.html');
});

app.post('/api/results', async (req, res) => {
    try {
        if (process.env.MONGO_URI && mongoose.connection.readyState === 1) {
            // Use MongoDB
            const newResult = new Result({ 
                candidateId: req.body.candidateId, 
                score: req.body.score, 
                total: req.body.total 
            });
            await newResult.save();
        } else {
            // Use in-memory storage
            const newResult = {
                candidateId: req.body.candidateId,
                score: req.body.score,
                total: req.body.total,
                submittedAt: new Date()
            };
            inMemoryResults.push(newResult);
        }
        res.status(201).send({ message: 'Result saved successfully!' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).send({ message: 'Error saving result' });
    }
});

app.get('/api/results', async (req, res) => {
    try {
        let results;
        if (process.env.MONGO_URI && mongoose.connection.readyState === 1) {
            // Use MongoDB
            results = await Result.find({}).sort({ submittedAt: -1 });
        } else {
            // Use in-memory storage
            results = inMemoryResults.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        }
        res.json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).send({ message: 'Error fetching results' });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});