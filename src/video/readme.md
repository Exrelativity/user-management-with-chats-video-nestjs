# Client Side WebRTC Connection and Signaling

```js

import io from 'socket.io-client';

const userId = 'user123'; // Unique ID for each user
const peerUserId = 'user456'; // ID of the peer to connect with
const socket = io('http://localhost:3000', { query: { userId } });

let localStream;
let peerConnection;

async function startVideoCall() {
  // Get media stream from the user's camera and microphone
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;

  // Initialize a new RTCPeerConnection
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // Public STUN server
  });

  // Add local stream tracks to the peer connection
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  // Handle ICE candidates
  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('ice-candidate', { toUserId: peerUserId, candidate });
    }
  };

  // Handle incoming remote stream
  peerConnection.ontrack = ({ streams: [stream] }) => {
    document.getElementById('remoteVideo').srcObject = stream;
  };

  // Create an offer and send it to the peer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { toUserId: peerUserId, offer });
}

// Handle receiving an offer
socket.on('offer', async ({ fromUserId, offer }) => {
  peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('ice-candidate', { toUserId: fromUserId, candidate });
    }
  };

  peerConnection.ontrack = ({ streams: [stream] }) => {
    document.getElementById('remoteVideo').srcObject = stream;
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { toUserId: fromUserId, answer });
});

// Handle receiving an answer
socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle receiving ICE candidates
socket.on('ice-candidate', async ({ candidate }) => {
  if (candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

```

### **Explanation of Client-Side Code**

**Local Stream:** Uses navigator.mediaDevices.getUserMedia to access the user's webcam and microphone.
**PeerConnection Setup:** Establishes an RTCPeerConnection object with a STUN server for ICE negotiation.
**Signaling Events:** Handles offer, answer, and ice-candidate messages from the WebSocket server for establishing and maintaining the P2P connection.
**Adding Tracks:** Adds media tracks from the local stream to the peer connection.

## HTML for Video Elements

```html
<video id="localVideo" autoplay playsinline></video>
<video id="remoteVideo" autoplay playsinline></video>
<button onclick="startVideoCall()">Start Call</button>
```

### **Additional Considerations**

**Security:** Secure WebSocket (WSS) and HTTPS are recommended for production deployments.
**STUN/TURN Servers:** For NAT traversal, especially in restrictive networks, a TURN server is often needed in addition to STUN.
**Error Handling:** Implement error handling for scenarios where the peer is offline or unavailable.

### Updated Client-Side JavaScript (P2P and Group Conferencing)

```js
const socket = io('http://localhost:3000', { query: { userId: 'user123' } });
const localVideo = document.getElementById('localVideo');
const remoteVideosContainer = document.getElementById('remoteVideosContainer');
let localStream;
const peers = {}; // Store peer connections by user ID

async function getLocalStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

// Create a new RTCPeerConnection and configure it
function createPeerConnection(userId) {
  const peerConnection = new RTCPeerConnection();

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('ice-candidate', { room: 'room1', candidate });
    }
  };

  peerConnection.ontrack = ({ streams: [stream] }) => {
    let remoteVideo = document.getElementById(userId);
    if (!remoteVideo) {
      remoteVideo = document.createElement('video');
      remoteVideo.id = userId;
      remoteVideo.autoplay = true;
      remoteVideosContainer.appendChild(remoteVideo);
    }
    remoteVideo.srcObject = stream;
  };

  peers[userId] = peerConnection;
  return peerConnection;
}

// Join a room
socket.emit('joinRoom', 'room1');

// When a new user joins, establish a connection
socket.on('user-joined', async ({ userId }) => {
  const peerConnection = createPeerConnection(userId);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { room: 'room1', offer });
});

// Handle incoming offer
socket.on('offer', async ({ offer, fromUserId }) => {
  const peerConnection = createPeerConnection(fromUserId);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { room: 'room1', answer });
});

// Handle incoming answer
socket.on('answer', ({ answer, fromUserId }) => {
  peers[fromUserId].setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE candidates
socket.on('ice-candidate', ({ candidate, fromUserId }) => {
  peers[fromUserId].addIceCandidate(new RTCIceCandidate(candidate));
});

// Leave the room
function leaveRoom() {
  socket.emit('leaveRoom', 'room1');
  for (const userId in peers) {
    peers[userId].close();
    delete peers[userId];
  }
  remoteVideosContainer.innerHTML = ''; // Clear remote videos
}

```

# Updates

```
import { io } from 'socket.io-client';

const chatSocket = io('http://localhost:3000/chat');  // Connects to chat namespace
const videoSocket = io('http://localhost:3000/video'); // Connects to video namespace
```
