# Chain Reaction Game Server

This directory contains information about the WebSocket server implementation required for the Chain Reaction game.

## Server Implementation Requirements

The server needs to implement the following WebSocket events:

### Connection Events
- `connection-established`: Sent to client upon successful connection with client ID
- `error`: Sent when an error occurs

### Game Management Events
- `create-game`: Receive request to create a new game
- `game-created`: Send confirmation of game creation
- `join-game`: Receive request to join an existing game
- `game-joined`: Send confirmation of joining a game
- `join-rejected`: Send rejection when a player can't join

### Lobby Events
- `get-lobby`: Receive request for lobby information
- `lobby-update`: Send lobby information updates
- `leave-lobby`: Receive request to leave a lobby

### Game Events
- `start-game`: Receive request to start a game
- `game-started`: Send confirmation that a game has started
- `get-game-state`: Receive request for current game state
- `game-state`: Send game state updates
- `make-move`: Receive move from a player
- `leave-game`: Receive request to leave a game

## Implementation Notes

The server should:
1. Maintain game state for each active game
2. Process game moves according to Chain Reaction rules
3. Validate player moves 
4. Handle player disconnections gracefully
5. Clean up games that are abandoned

## Example Server Implementation

A basic server could be implemented using Node.js with the `ws` package:

```javascript
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const server = new WebSocket.Server({ port: 3000 });
const games = new Map();
const clients = new Map();

server.on('connection', (socket, request) => {
  const clientId = uuidv4();
  const gameCode = new URL(request.url, 'http://localhost').searchParams.get('gameCode');
  
  clients.set(clientId, { socket, gameCode });
  
  socket.send(JSON.stringify({
    type: 'connection-established',
    data: { clientId }
  }));
  
  socket.on('message', (message) => {
    const { type, data } = JSON.parse(message);
    
    // Handle different message types here
  });
  
  socket.on('close', () => {
    // Handle client disconnection
  });
});
```

For a complete implementation, additional logic would be needed to handle game mechanics, player management, and state synchronization.
