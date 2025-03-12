import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';
import * as socketService from './socketService';
import type { Player, Cell, GameState, LobbyData, GameSettings, PlayerInfo } from './types';

// Store for player info
export const playerStore: Writable<PlayerInfo> = writable({ id: null, name: '', color: '' });

// Create empty grid based on dimensions
function createEmptyGrid(x: number, y: number): Cell[][] {
  return Array(x).fill(null).map(() => 
    Array(y).fill(null).map(() => ({ count: 0, player: null }))
  );
}

/**
 * Create a new game
 * @param {number} gridSizeX - Width of the grid
 * @param {number} gridSizeY - Height of the grid
 * @param {number} playerCount - Maximum number of players
 * @returns {Promise<string>} Game code
 */
export async function createGame(gridSizeX: number, gridSizeY: number, playerCount: number): Promise<string> {
  if (!browser) return '';
  
  // Generate player name (could be replaced with user input)
  const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
  
  // Connect to server without a specific game code first
  const connection = await socketService.connect('');
  
  if (!connection) {
    throw new Error('Failed to connect to game server');
  }
  
  // Create game settings
  const settings: GameSettings = {
    gridSizeX,
    gridSizeY,
    playerCount
  };
  
  // Emit create game event
  socketService.emit('create-game', {
    playerName,
    settings
  });
  
  // Wait for server to confirm game creation
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Game creation timed out'));
    }, 10000);
    
    const unsubscribe = socketService.on('game-created', (data) => {
      clearTimeout(timeout);
      unsubscribe();
      
      // Store player info
      playerStore.set({ 
        id: data.playerId, 
        name: playerName, 
        color: data.color 
      });
      
      resolve(data.gameCode);
    });
    
    // Handle errors
    const errorUnsubscribe = socketService.on('error', (error) => {
      clearTimeout(timeout);
      unsubscribe();
      errorUnsubscribe();
      reject(new Error(error.message || 'Failed to create game'));
    });
  });
}

/**
 * Join an existing game
 * @param {string} gameCode - The game code to join
 * @returns {Promise<boolean>} Success status
 */
export async function joinGame(gameCode: string): Promise<boolean> {
  if (!browser) return false;
  
  if (!gameCode) {
    throw new Error('Please enter a game code');
  }
  
  // Connect to server
  const connection = await socketService.connect(gameCode);
  
  if (!connection) {
    throw new Error('Failed to connect to game server');
  }
  
  // Generate player name (could be replaced with user input)
  const playerName = `Player ${Math.floor(Math.random() * 1000)}`;
  
  // Emit join game event
  socketService.emit('join-game', {
    gameCode,
    playerName
  });
  
  // Wait for server to confirm joining
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      rejectUnsubscribe();
      reject(new Error('Join game request timed out'));
    }, 5000);
    
    const unsubscribe = socketService.on('game-joined', (data) => {
      clearTimeout(timeout);
      unsubscribe();
      rejectUnsubscribe();
      
      // Store player info
      playerStore.set({ 
        id: data.playerId, 
        name: playerName, 
        color: data.color 
      });
      
      resolve(true);
    });
    
    // Handle rejection (e.g., game is full)
    const rejectUnsubscribe = socketService.on('join-rejected', (error) => {
      clearTimeout(timeout);
      unsubscribe();
      rejectUnsubscribe();
      reject(new Error(error.message || 'Failed to join game'));
    });
  });
}

/**
 * Get lobby information and subscribe to updates
 * @param {string} gameCode - The game code
 * @param {Function} callback - Function to call when lobby data updates
 * @returns {Function} Unsubscribe function
 */
export function getLobbyInfo(gameCode: string, callback: (data: LobbyData) => void): () => void {
  if (!browser) return () => {};
  
  // Emit request for lobby info
  socketService.emit('get-lobby', { gameCode });
  
  // Subscribe to lobby updates
  const unsubscribe = socketService.on('lobby-update', (data: LobbyData) => {
    callback(data);
  });
  
  return unsubscribe;
}

/**
 * Start the game
 * @param {string} gameCode - The game code
 * @returns {Promise<boolean>} Success status
 */
export async function startGame(gameCode: string): Promise<boolean> {
  if (!browser) return false;
  
  console.log(`Starting game with code: ${gameCode}`);
  
  // Emit start game event
  socketService.emit('start-game', { gameCode });
  
  // Wait for server to confirm game start
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      errorUnsubscribe();
      reject(new Error('Start game request timed out'));
    }, 10000); // Increased timeout for better reliability
    
    const unsubscribe = socketService.on('game-started', (data) => {
      console.log('Game started event received:', data);
      clearTimeout(timeout);
      unsubscribe();
      errorUnsubscribe();
      resolve(true);
    });
    
    // Handle errors
    const errorUnsubscribe = socketService.on('error', (error) => {
      console.error('Error starting game:', error);
      clearTimeout(timeout);
      unsubscribe();
      errorUnsubscribe();
      reject(new Error(error.message || 'Failed to start game'));
    });
  });
}

/**
 * Get the current game state and subscribe to updates
 * @param {string} gameCode - The game code
 * @param {Function} callback - Function to call when game state updates
 * @returns {Function} Unsubscribe function
 */
export function getGameState(gameCode: string, callback: (state: GameState) => void): () => void {
  if (!browser) return () => {};
  
  // Emit request for game state
  socketService.emit('get-game-state', { gameCode });
  
  // Subscribe to game state updates
  return socketService.on('game-state', (state: GameState) => {
    callback(state);
  });
}

/**
 * Make a move in the game
 * @param {string} gameCode - The game code
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Promise<boolean>} Success status
 */
export async function makeMove(gameCode: string, x: number, y: number): Promise<boolean> {
  if (!browser) return false;
  
  // Emit make move event
  socketService.emit('make-move', { gameCode, x, y });
  
  // The server will update all clients with the new game state
  // through the 'game-state' event we're already listening to
  return true;
}

/**
 * Leave the current game
 * @param {string} gameCode - The game code
 * @returns {Promise<boolean>} Success status
 */
export async function leaveGame(gameCode: string): Promise<boolean> {
  if (!browser) return false;
  
  // Emit leave game event
  socketService.emit('leave-game', { gameCode });
  
  // Close the WebSocket connection
  const connection = await socketService.connect(gameCode);
  if (connection) {
    connection.disconnect();
  }
  
  return true;
}

/**
 * Leave the current lobby
 * @param {string} gameCode - The game code
 * @returns {Promise<boolean>} Success status
 */
export async function leaveLobby(gameCode: string): Promise<boolean> {
  if (!browser) return false;
  
  // Emit leave lobby event
  socketService.emit('leave-lobby', { gameCode });
  
  // Close the WebSocket connection
  const connection = await socketService.connect(gameCode);
  if (connection) {
    connection.disconnect();
  }
  
  return true;
}

/**
 * Update player name in the lobby
 * @param {string} gameCode - The game code
 * @param {string} name - New player name
 * @returns {Promise<boolean>} Success status
 */
export async function updatePlayerName(gameCode: string, name: string): Promise<boolean> {
  if (!browser) return false;
  
  if (!name || name.trim() === '') {
    throw new Error('Name cannot be empty');
  }
  
  // Emit update name event
  socketService.emit('update-name', { gameCode, name });
  
  // Update the local player store
  playerStore.update(player => ({
    ...player,
    name
  }));
  
  // Wait for server to confirm the update
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      errorUnsubscribe();
      reject(new Error('Update name request timed out'));
    }, 5000);
    
    const unsubscribe = socketService.on('name-updated', (data) => {
      clearTimeout(timeout);
      unsubscribe();
      errorUnsubscribe();
      resolve(data.success);
    });
    
    // Handle errors
    const errorUnsubscribe = socketService.on('error', (error) => {
      clearTimeout(timeout);
      unsubscribe();
      errorUnsubscribe();
      reject(new Error(error.message || 'Failed to update name'));
    });
  });
}
