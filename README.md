# Chain Reaction Game

A multiplayer Chain Reaction game built with SvelteKit, WebSockets, and TailwindCSS.

## Getting Started

### Setting up the project

1. Clone this repository
2. Install dependencies:

```bash
# Install client dependencies
npm install

# Install server dependencies
npm run install:server
```

### Running the application for local testing

To run both the client and server simultaneously:

```bash
npm run dev:all
```

This will start:
- The SvelteKit application on http://localhost:5173
- The WebSocket server on port 3000

### Alternative: Run client and server separately

```bash
# Run the client
npm run dev

# In another terminal, run the server
npm run dev:server
```

### Building for production

To build both the client and the server:

```bash
# Build the client
npm run build 

# Build the TypeScript server
npm run build:server
```

## Game Mechanics

Chain Reaction is a multiplayer strategy game where:

1. Players take turns placing atoms in cells
2. When a cell reaches its capacity, it "explodes" and distributes atoms to adjacent cells
3. This can cause chain reactions of explosions
4. A player who captures all of an opponent's cells wins

## Development

### Client-Side Code

The client is built with SvelteKit and TypeScript. You can find the client-side code in the `src` directory.

### Server-Side Code

The server is built with TypeScript and WebSockets. You can find the server code in the `server` directory:
- `server.ts` - The main WebSocket server
- `gameLogic.ts` - Game mechanics implementation
- `types.ts` - TypeScript interfaces for the server

## Deployment

For deployment, you'll need to set up both the client (SvelteKit) and the WebSocket server on your hosting platform.
