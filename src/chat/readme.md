# Client Side implementation

```js
import io from 'socket.io-client';

const userId = 'user123'; // This should be the unique ID of the current user
const socket = io('http://localhost:3000', { query: { userId } });

// Listen for incoming private messages
socket.on('privateMessage', (data) => {
  console.log(`Message from ${data.fromUserId}: ${data.message}`);
});

// Send a private message to another user
function sendPrivateMessage(toUserId, message) {
  socket.emit('privateMessage', { toUserId, message });
}
```

# Updates

```
import { io } from 'socket.io-client';

const chatSocket = io('http://localhost:3000/chat');  // Connects to chat namespace
const videoSocket = io('http://localhost:3000/video'); // Connects to video namespace
```
