const socket = io();
const countSpan = document.getElementById('candidate-count');
const videoGrid = document.getElementById('video-grid');
const waitingList = document.getElementById('waiting-list');
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const peerConnections = {};

socket.on('update-count', (count) => { countSpan.textContent = count; });

socket.on('update-waiting-list', (interns) => {
    waitingList.innerHTML = '';
    for (const id in interns) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${interns[id].name}</span> <button class="admit-btn" data-id="${id}">Admit</button>`;
        waitingList.appendChild(li);
    }
});

waitingList.addEventListener('click', (e) => {
    if (e.target.classList.contains('admit-btn')) {
        const socketId = e.target.getAttribute('data-id');
        socket.emit('admit-intern', { socketId: socketId });
    }
});

socket.on('offer-for-admin', async ({ offer, from, name }) => {
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnections[from] = peerConnection;

    peerConnection.ontrack = (event) => {
        let videoContainer = document.getElementById(`container-${from}`);
        if (!videoContainer) {
            videoContainer = document.createElement('div');
            videoContainer.id = `container-${from}`;
            videoContainer.className = 'video-container';
            
            const video = document.createElement('video');
            video.srcObject = event.streams[0];
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true; // Fix for browser autoplay policies
            
            const nameTag = document.createElement('div');
            nameTag.className = 'name-tag';
            nameTag.textContent = name;
            
            videoContainer.appendChild(video);
            videoContainer.appendChild(nameTag);
            videoGrid.appendChild(videoContainer);
        }
    };

    peerConnection.onicecandidate = (event) => { if (event.candidate) { socket.emit('ice-candidate-from-admin', { candidate: event.candidate, to: from }); } };
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer-from-admin', { answer: answer, to: from });
});

socket.on('ice-candidate-for-admin', ({ candidate, from }) => {
    if (peerConnections[from]) { peerConnections[from].addIceCandidate(new RTCIceCandidate(candidate)); }
});

socket.on('user-disconnected', (socketId) => {
    if (peerConnections[socketId]) {
        peerConnections[socketId].close();
        delete peerConnections[socketId];
    }
    const videoContainer = document.getElementById(`container-${socketId}`);
    if (videoContainer) { videoContainer.remove(); }
});