# Chain Rxn Game Server

WebSocket server for the Chain Rxn multiplayer game.

## Overview

This server powers the multiplayer functionality of the Chain Rxn game using WebSockets. It manages game state, player connections, and game logic.

## Development

To start the server in development mode:

```bash
npm run dev
```

This uses `tsc-watch` to automatically rebuild the TypeScript files when they change.

## Building

To build the server:

```bash
npm run build
```

This compiles the TypeScript files to JavaScript in the `dist` directory.

## Production

To run the server in production mode:

```bash
npm run start
```

This runs the compiled JavaScript from the `dist` directory.

## API Documentation

### WebSocket Events

#### Connection Events
- `connection-established`: Sent to client upon successful connection with client ID
- `error`: Sent when an error occurs

#### Game Management
- `create-game`: Receive request to create a new game
- `game-created`: Send confirmation of game creation
- `join-game`: Receive request to join a game
- `game-joined`: Send confirmation of joining
- `join-rejected`: Send when a player can't join

#### Lobby Management
- `get-lobby`: Receive request for lobby information
- `lobby-update`: Send lobby information updates
- `leave-lobby`: Receive request to leave a lobby

#### Game Events
- `start-game`: Receive request to start a game
- `game-started`: Send confirmation that game has started
- `get-game-state`: Receive request for current game state
- `game-state`: Send game state updates
- `make-move`: Receive move from a player
- `leave-game`: Receive request to leave a game

## Architecture

The server consists of three main TypeScript files:

1. `server.ts` - The main WebSocket server that handles client connections and game event routing
2. `gameLogic.ts` - Implements the Chain Rxn game rules and state management
3. `types.ts` - TypeScript type definitions shared across the server
