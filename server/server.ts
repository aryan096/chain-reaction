import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createGameState, processMove, isValidMove } from './gameLogic.js';
import { Client, Game, Player, ExtendedWebSocket, GameSettings } from './types.js';
import * as url from 'url';
import * as http from 'http';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = new WebSocketServer({ port: PORT });

// Game storage
const games: Map<string, Game> = new Map();
const clients: Map<string, Client> = new Map();
const colorPalette: string[] = [
  '#FF5252', // Red
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FFC107', // Yellow
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#795548'  // Brown
];

console.log(`WebSocket server started on port ${PORT}`);

// Handle new client connections
server.on('connection', (socket: WebSocket, request: http.IncomingMessage) => {
  // Generate a client ID
  const clientId = uuidv4();
  
  // Parse game code from URL if available
  const parsedUrl = url.parse(request.url || '', true);
  const gameCode = parsedUrl.query.gameCode as string | undefined;
  
  console.log(`New client connected: ${clientId}${gameCode ? ` for game ${gameCode}` : ''}`);
  
  // Store client information
  clients.set(clientId, {
    socket: socket as ExtendedWebSocket,
    gameCode: null, // Will be set when creating or joining a game
    playerId: clientId
  });
  
  // Send connection confirmation
  send(socket, 'connection-established', { clientId });
  
  // Handle incoming messages
  socket.on('message', (message: WebSocket.Data) => {
    try {
      const { type, data } = JSON.parse(message.toString());
      
      // Handle message types
      switch (type) {
        case 'create-game':
          handleCreateGame(clientId, data);
          break;
          
        case 'join-game':
          handleJoinGame(clientId, data);
          break;
          
        case 'get-lobby':
          handleGetLobby(clientId, data);
          break;
          
        case 'start-game':
          handleStartGame(clientId, data);
          break;
          
        case 'get-game-state':
          handleGetGameState(clientId, data);
          break;
          
        case 'make-move':
          handleMakeMove(clientId, data);
          break;
          
        case 'leave-game':
          handleLeaveGame(clientId, data);
          break;
          
        case 'leave-lobby':
          handleLeaveLobby(clientId, data);
          break;
          
        case 'update-name':
          handleUpdateName(clientId, data);
          break;
          
        default:
          console.warn(`Unhandled message type: ${type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      send(socket, 'error', { message: 'Invalid message format' });
    }
  });
  
  // Handle disconnections
  socket.on('close', () => {
    handleClientDisconnect(clientId);
  });
});

// HANDLER FUNCTIONS

function handleCreateGame(clientId: string, data: { playerName: string, settings: GameSettings }): void {
  const { playerName, settings } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  // Generate a game code
  const gameCode = generateGameCode();
  
  // Assign a color to the first player (host)
  const playerColor = colorPalette[0];
  
  // Create player object
  const player: Player = {
    id: clientId,
    name: playerName,
    color: playerColor,
    order: 0,
    isHost: true,
    cellCount: 0
  };
  
  // Create game object
  games.set(gameCode, {
    players: [player],
    settings,
    started: false,
    gameState: null
  });
  
  // Update client with game code
  client.gameCode = gameCode;
  
  // Confirm game creation
  send(client.socket, 'game-created', {
    gameCode,
    playerId: clientId,
    color: playerColor
  });
  
  console.log(`Game created: ${gameCode} by client ${clientId}`);
}

function handleJoinGame(clientId: string, data: { gameCode: string, playerName: string }): void {
  const { gameCode, playerName } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  // Check if game exists
  const game = games.get(gameCode);
  if (!game) {
    send(client.socket, 'join-rejected', { 
      message: `Game ${gameCode} does not exist` 
    });
    return;
  }
  
  // Check if game is already started
  if (game.started) {
    send(client.socket, 'join-rejected', { 
      message: 'Game has already started' 
    });
    return;
  }
  
  // Check if game is full
  if (game.players.length >= game.settings.playerCount) {
    send(client.socket, 'join-rejected', { 
      message: 'Game is full' 
    });
    return;
  }
  
  // Assign player color based on position
  const playerColor = colorPalette[game.players.length];
  
  // Create player object
  const player: Player = {
    id: clientId,
    name: playerName,
    color: playerColor,
    order: game.players.length,
    isHost: false,
    cellCount: 0
  };
  
  // Add player to game
  game.players.push(player);
  
  // Update client with game code
  client.gameCode = gameCode;
  
  // Confirm joining
  send(client.socket, 'game-joined', {
    gameCode,
    playerId: clientId,
    color: playerColor
  });
  
  // Send lobby update to all players in the game
  broadcastLobbyUpdate(gameCode);
  
  console.log(`Player ${clientId} joined game ${gameCode}`);
}

function handleGetLobby(clientId: string, data: { gameCode: string }): void {
  const { gameCode } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  const game = games.get(gameCode);
  if (!game) {
    send(client.socket, 'error', { 
      message: `Game ${gameCode} does not exist` 
    });
    return;
  }
  
  // Send lobby data to the requester
  const lobbyData = {
    players: game.players,
    isHost: game.players.find(p => p.id === clientId)?.isHost || false,
    settings: game.settings
  };
  
  send(client.socket, 'lobby-update', lobbyData);
}

function handleStartGame(clientId: string, data: { gameCode: string }): void {
  const { gameCode } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  const game = games.get(gameCode);
  if (!game) {
    send(client.socket, 'error', { 
      message: `Game ${gameCode} does not exist` 
    });
    return;
  }
  
  // Check if client is the host
  const player = game.players.find(p => p.id === clientId);
  if (!player || !player.isHost) {
    send(client.socket, 'error', { 
      message: 'Only the host can start the game' 
    });
    return;
  }
  
  // Check if we have enough players
  if (game.players.length < 2) {
    send(client.socket, 'error', { 
      message: 'Need at least 2 players to start' 
    });
    return;
  }
  
  // Initialize game state
  game.started = true;
  game.gameState = createGameState(game.settings, game.players);
  
  console.log(`Starting game ${gameCode} with ${game.players.length} players`);
  
  // Notify all players that game has started
  game.players.forEach(player => {
    const playerClient = getClientById(player.id);
    if (playerClient) {
      console.log(`Sending game-started to player ${player.id}`);
      send(playerClient.socket, 'game-started', { gameCode });
    } else {
      console.error(`Could not find client for player ${player.id}`);
    }
  });
  
  console.log(`Game started: ${gameCode}`);
  
  // Immediately send the game state to all players
  broadcastGameState(gameCode);
}

function handleGetGameState(clientId: string, data: { gameCode: string }): void {
  const { gameCode } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  const game = games.get(gameCode);
  if (!game || !game.gameState) {
    send(client.socket, 'error', { 
      message: `Game ${gameCode} does not exist or hasn't started` 
    });
    return;
  }
  
  // Send game state to the requester with isMyTurn flag
  const gameStateWithTurn = {
    ...game.gameState,
    isMyTurn: game.gameState.currentPlayer.id === clientId
  };
  
  send(client.socket, 'game-state', gameStateWithTurn);
}

function handleMakeMove(clientId: string, data: { gameCode: string, x: number, y: number }): void {
  const { gameCode, x, y } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  const game = games.get(gameCode);
  if (!game || !game.gameState) {
    send(client.socket, 'error', { 
      message: `Game ${gameCode} does not exist or hasn't started` 
    });
    return;
  }
  
  // Check if it's the player's turn
  if (game.gameState.currentPlayer.id !== clientId) {
    send(client.socket, 'error', { 
      message: "It's not your turn" 
    });
    return;
  }
  
  // Check if the move is valid
  if (!isValidMove(game.gameState, x, y, clientId)) {
    send(client.socket, 'error', { 
      message: "Invalid move" 
    });
    return;
  }
  
  // Process the move and update game state
  const updatedState = processMove(game.gameState, x, y);
  game.gameState = updatedState;
  
  // Broadcast updated game state to all players
  broadcastGameState(gameCode);
  
  console.log(`Player ${clientId} made move at ${x},${y} in game ${gameCode}`);
}

function handleLeaveGame(clientId: string, data: { gameCode: string }): void {
  const { gameCode } = data;
  handlePlayerLeave(clientId, gameCode, true);
}

function handleLeaveLobby(clientId: string, data: { gameCode: string }): void {
  const { gameCode } = data;
  handlePlayerLeave(clientId, gameCode, false);
}

function handleClientDisconnect(clientId: string): void {
  const client = clients.get(clientId);
  
  if (client && client.gameCode) {
    handlePlayerLeave(clientId, client.gameCode, true);
  }
  
  clients.delete(clientId);
  console.log(`Client disconnected: ${clientId}`);
}

// Add new handler for updating player name
function handleUpdateName(clientId: string, data: { gameCode: string, name: string }): void {
  const { gameCode, name } = data;
  const client = clients.get(clientId);
  
  if (!client) {
    console.error(`Client not found: ${clientId}`);
    return;
  }
  
  const game = games.get(gameCode);
  if (!game) {
    send(client.socket, 'error', { 
      message: `Game ${gameCode} does not exist` 
    });
    return;
  }
  
  // Find the player in the game and update the name
  const player = game.players.find(p => p.id === clientId);
  if (player) {
    // Update player name
    player.name = name;
    
    // Confirm name update to the requester
    send(client.socket, 'name-updated', { success: true });
    
    // Broadcast lobby update to all players
    broadcastLobbyUpdate(gameCode);
    
    console.log(`Player ${clientId} updated name to "${name}" in game ${gameCode}`);
  } else {
    send(client.socket, 'error', { 
      message: 'Player not found in this game' 
    });
  }
}

// HELPER FUNCTIONS

function handlePlayerLeave(clientId: string, gameCode: string, isGame: boolean): void {
  const client = clients.get(clientId);
  if (!client) return;
  
  const game = games.get(gameCode);
  if (!game) return;
  
  // Remove player from game
  const playerIndex = game.players.findIndex(p => p.id === clientId);
  
  if (playerIndex !== -1) {
    const isHost = game.players[playerIndex].isHost;
    game.players.splice(playerIndex, 1);
    
    // If host left, assign a new host or delete the game
    if (isHost && game.players.length > 0) {
      game.players[0].isHost = true;
    }
    
    // If game is empty, delete it
    if (game.players.length === 0) {
      games.delete(gameCode);
      console.log(`Game deleted: ${gameCode}`);
    } else if (isGame && game.started) {
      // Handle player leaving an active game
      if (game.gameState && game.players.length > 1) {
        // Remove player's cells and update game state
        const newState = { ...game.gameState };
        
        // Set all cells of the leaving player to null
        for (let x = 0; x < newState.settings.gridSizeX; x++) {
          for (let y = 0; y < newState.settings.gridSizeY; y++) {
            if (newState.grid[x][y].player === clientId) {
              newState.grid[x][y] = { count: 0, player: null };
            }
          }
        }
        
        // Update current player if needed
        if (newState.currentPlayer.id === clientId) {
          const nextPlayerIndex = (playerIndex + 1) % game.players.length;
          newState.currentPlayer = game.players[nextPlayerIndex];
        }
        
        // Recalculate cell counts
        newState.players = newState.players.filter(p => p.id !== clientId);
        game.gameState = newState;
        
        // Broadcast updated game state
        broadcastGameState(gameCode);
      }
    } else {
      // Broadcast lobby update if in lobby
      broadcastLobbyUpdate(gameCode);
    }
  }
  
  client.gameCode = null;
}

function broadcastLobbyUpdate(gameCode: string): void {
  const game = games.get(gameCode);
  if (!game) return;
  
  game.players.forEach(player => {
    const client = getClientById(player.id);
    if (client) {
      const lobbyData = {
        players: game.players,
        isHost: player.isHost,
        settings: game.settings
      };
      
      send(client.socket, 'lobby-update', lobbyData);
    }
  });
}

function broadcastGameState(gameCode: string): void {
  const game = games.get(gameCode);
  if (!game || !game.gameState) return;
  
  game.players.forEach(player => {
    const client = getClientById(player.id);
    if (client) {
      // Clone game state and add isMyTurn flag for this specific player
      const playerGameState = game.gameState ? {
        ...game.gameState,
        isMyTurn: game.gameState.currentPlayer.id === player.id
      } : null;
      
      send(client.socket, 'game-state', playerGameState);
    }
  });
}

function getClientById(clientId: string): Client | undefined {
  return clients.get(clientId);
}

function send(socket: WebSocket, type: string, data: any): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
    console.log(`Sent ${type} to client`, data);
  } else {
    console.warn(`Socket not ready, can't send ${type}`, data);
  }
}

function generateGameCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Check if code already exists
  if (games.has(result)) {
    return generateGameCode(); // Recursive call to get unique code
  }
  
  return result;
}
