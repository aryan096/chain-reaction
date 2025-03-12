export interface Player {
  id: string;
  name: string;
  color: string;
  order: number;
  isHost: boolean;
  cellCount: number;
  isEliminated?: boolean; // Add this field
}

export interface Cell {
  count: number;
  player: string | null;
}

export interface GameSettings {
  gridSizeX: number;
  gridSizeY: number;
  playerCount: number;
}

export interface GameState {
  grid: Cell[][];
  players: Player[];
  currentPlayer: Player;
  settings: GameSettings;
  isMyTurn: boolean; // Client-side specific
  gameOver: boolean;
  winner: Player | null;
  moveCount: number;
  eliminatedPlayers?: string[]; // Add this field
}

export interface LobbyData {
  players: Player[];
  isHost: boolean;
  settings: GameSettings;
}

export interface PlayerInfo {
  id: string | null;
  name: string;
  color: string;
}
