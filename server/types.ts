import { WebSocket } from 'ws';

/**
 * Player representation in the game
 */
export interface Player {
  id: string;
  name: string;
  color: string;
  order: number;
  isHost: boolean;
  cellCount: number;
  isEliminated?: boolean; // Add this field to track eliminated players
}

/**
 * Cell in the game grid
 */
export interface Cell {
  count: number;
  player: string | null;
}

/**
 * Game configuration settings
 */
export interface GameSettings {
  gridSizeX: number;
  gridSizeY: number;
  playerCount: number;
}

/**
 * Game state representation
 */
export interface GameState {
  grid: Cell[][];
  players: Player[];
  currentPlayer: Player;
  settings: GameSettings;
  gameOver: boolean;
  winner: Player | null;
  moveCount: number;
  eliminatedPlayers?: string[]; // Add this field to keep track of eliminated players
}

/**
 * Game instance that includes players and state
 */
export interface Game {
  players: Player[];
  settings: GameSettings;
  started: boolean;
  gameState: GameState | null;
}

/**
 * WebSocket with custom clientId property
 */
export interface ExtendedWebSocket extends WebSocket {
  clientId?: string;
}

/**
 * Client connection information
 */
export interface Client {
  socket: ExtendedWebSocket;
  gameCode: string | null;
  playerId: string;
}
