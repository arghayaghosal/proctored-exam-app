const questions = [
    { q: "What does HTML stand for?", o: ["Hyper Text Markup Language", "Hyper Tool Multi Language"], a: 0 },
    { q: "Which of these is NOT a programming language?", o: ["Python", "HTML", "Java"], a: 1 },
    { q: "What is the capital of Japan?", o: ["Kyoto", "Osaka", "Tokyo"], a: 2 },
    { q: "What does CSS stand for?", o: ["Cascading Style Sheets", "Creative Style System"], a: 0 },
    { q: "In JavaScript, what keyword declares a variable that cannot be reassigned?", o: ["let", "var", "const"], a: 2 },
    { q: "What is the command to initialize a new Node.js project?", o: ["npm start", "npm init", "node new"], a: 1 },
    { q: "Which planet is known as the Red Planet?", o: ["Mars", "Jupiter", "Venus"], a: 0 },
    { q: "What is 10 + 5 * 2?", o: ["30", "20", "25"], a: 1 },
    { q: "What company developed the React library?", o: ["Google", "Microsoft", "Facebook"], a: 2 },
    { q: "What is the purpose of a database?", o: ["To style webpages", "To store and retrieve data efficiently"], a: 1 }
];

const startScreen = document.getElementById('start-screen'), waitingScreen = document.getElementById('waiting-screen'), examScreen = document.getElementById('exam-screen'), endScreen = document.getElementById('end-screen');
const startButton = document.getElementById('start-button'), candidateNameInput = document.getElementById('candidate-name');
const questionText = document.getElementById('question-text'), optionsContainer = document.getElementById('options-container'), timerDisplay = document.getElementById('timer'), nextButton = document.getElementById('next-button');
const endTitle = document.getElementById('end-title'), endMessage = document.getElementById('end-message');

let socket, localStream, peerConnection, candidateName = '', currentQuestionIndex = 0, score = 0, selectedOptionIndex = -1, questionTimeout, countdownInterval;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

startButton.addEventListener('click', joinWaitingRoom);
nextButton.addEventListener('click', () => { processAnswer(); displayNextQuestion(); });

function joinWaitingRoom() {
    candidateName = candidateNameInput.value.trim();
    if (!candidateName) { alert('Please enter your name.'); return; }
    startScreen.style.display = 'none';
    waitingScreen.style.display = 'block';
    socket = io();
    setupSocketListeners();
}

function setupSocketListeners() {
    socket.on('connect', () => {
        socket.emit('intern-waiting', { name: candidateName });
    });

    socket.on('permission-granted', async () => {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            waitingScreen.style.display = 'none';
            examScreen.style.display = 'block';
            createPeerConnection();
            document.addEventListener('visibilitychange', handleVisibilityChange);
            displayNextQuestion();
        } catch (err) {
            alert("You must grant camera and microphone access to begin the exam.");
            terminateExam("Permission denied");
        }
    });
    
    socket.on('answer-for-intern', async (answer) => {
        if (peerConnection && !peerConnection.currentRemoteDescription) { await peerConnection.setRemoteDescription(new RTCSessionDescription(answer)); }
    });
    socket.on('ice-candidate-for-intern', (candidate) => {
        if (peerConnection) { peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); }
    });
}

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    localStream.getTracks().forEach(track => { peerConnection.addTrack(track, localStream); });
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) { socket.emit('ice-candidate-from-intern', { candidate: event.candidate }); }
    };
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer-from-intern', { offer: offer, name: candidateName });
}

function displayNextQuestion() {
    if (currentQuestionIndex >= questions.length) { finishExam(); return; }
    clearTimeout(questionTimeout); clearInterval(countdownInterval);
    selectedOptionIndex = -1;
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.q;
    optionsContainer.innerHTML = "";
    question.o.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.textContent = option;
        optionElement.addEventListener('click', () => selectOption(index, optionElement));
        optionsContainer.appendChild(optionElement);
    });
    startTimers();
}

function selectOption(index, element) { selectedOptionIndex = index; document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected')); element.classList.add('selected'); }
function processAnswer() { if (selectedOptionIndex === questions[currentQuestionIndex].a) { score++; } currentQuestionIndex++; }
function startTimers() {
    questionTimeout = setTimeout(() => { processAnswer(); displayNextQuestion(); }, 30000);
    let secondsLeft = 30;
    timerDisplay.textContent = `Time remaining: ${secondsLeft}s`;
    countdownInterval = setInterval(() => {
        secondsLeft--; timerDisplay.textContent = `Time remaining: ${secondsLeft}s`;
        if (secondsLeft <= 0) { clearInterval(countdownInterval); }
    }, 1000);
}

function handleVisibilityChange() { if (document.hidden) { terminateExam("Tab switched"); } }
function terminateExam(reason) {
    clearAllTimers();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    examScreen.style.display = 'none';
    endScreen.style.display = 'block';
    endTitle.textContent = "Test Terminated";
    endMessage.textContent = `Your session was terminated. Reason: ${reason}.`;
}

function finishExam() {
    clearAllTimers();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    const resultData = { score: score, total: questions.length, candidateId: candidateName };
    fetch('/api/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resultData) });
    examScreen.style.display = 'none';
    endScreen.style.display = 'block';
    endTitle.textContent = "Exam Complete!";
    endMessage.textContent = `Your final score is: ${score} out of ${questions.length}`;
}

function clearAllTimers() { clearTimeout(questionTimeout); clearInterval(countdownInterval); }