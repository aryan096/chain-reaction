import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type SocketConnection = {
  id: string;
  gameCode: string;
  disconnect: () => void;
};

interface ExtendedWebSocket extends WebSocket {
  clientId?: string;
}

// Socket connection status
export const connectionStatus: Writable<ConnectionStatus> = writable('disconnected');

// The WebSocket instance
let socket: ExtendedWebSocket | null = null;
let eventListeners: Map<string, Set<(data: any) => void>> = new Map();

// Server URL
const SERVER_URL = import.meta.env.DEV 
  ? 'ws://localhost:443' 
  : import.meta.env.VITE_WEBSOCKET_URL || 'wss://chain-reaction-production-7dd0.up.railway.app:443';

// Store the received events for debugging
export const lastEvents: Writable<{type: string, timestamp: Date}[]> = writable([]);
const MAX_EVENTS = 10;

/**
 * Connect to the game server
 * @param {string} gameCode - The game code to connect to (optional for game creation)
 * @returns {Promise<SocketConnection | null>} Socket connection object
 */
export function connect(gameCode: string): Promise<SocketConnection | null> {
  if (!browser) return Promise.resolve(null);
  
  connectionStatus.set('connecting');
  console.log(`Connecting to server${gameCode ? ` for game ${gameCode}` : ''}`);
  
  return new Promise((resolve, reject) => {
    try {
      // Close existing socket if any
      if (socket) {
        socket.close();
      }
      
      // Create new WebSocket connection
      const url = gameCode ? `${SERVER_URL}?gameCode=${gameCode}` : SERVER_URL;
      
      socket = new WebSocket(url) as ExtendedWebSocket;
      
      // Connection opened
      socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        connectionStatus.set('connected');
        
        const connection: SocketConnection = {
          id: 'pending-id', // Will be updated when server sends the ID
          gameCode,
          disconnect: () => {
            if (socket) {
              socket.close();
              socket = null;
            }
            connectionStatus.set('disconnected');
            console.log('Disconnected from game server');
          }
        };
        
        resolve(connection);
      });
      
      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data as string);
          const { type, data } = message;
          
          // Track events for debugging
          lastEvents.update(events => {
            const newEvents = [
              { type, timestamp: new Date() },
              ...events.slice(0, MAX_EVENTS - 1)
            ];
            return newEvents;
          });
          
          console.log(`Received WebSocket event: ${type}`, data);
          
          // Handle special messages
          if (type === 'connection-established') {
            console.log('Connection established with ID:', data.clientId);
            // Update connection ID once received from server
            if (data.clientId && socket) {
              socket.clientId = data.clientId;
            }
          }
          
          // Dispatch to event listeners
          const listeners = eventListeners.get(type);
          if (listeners) {
            listeners.forEach((callback) => {
              try {
                callback(data);
              } catch (error) {
                console.error(`Error in listener for event ${type}:`, error);
              }
            });
          } else {
            console.warn(`No listeners registered for event type: ${type}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Connection closed
      socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        connectionStatus.set('disconnected');
        socket = null;
      });
      
      // Connection error
      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        connectionStatus.set('disconnected');
        reject(error);
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      connectionStatus.set('disconnected');
      reject(error);
    }
  });
}

/**
 * Send a message to the server
 * @param {string} event - Event name
 * @param {any} data - Data to send
 */
export function emit(event: string, data: any): void {
  if (!browser || !socket) return;
  
  if (socket.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({ type: event, data });
    socket.send(message);
    console.log(`Emitting event: ${event}`, data);
  } else {
    console.warn(`Socket not connected, cannot emit event: ${event}`);
  }
}

/**
 * Listen for messages from the server
 * @param {string} event - Event name
 * @param {Function} callback - Function to call when event is received
 * @returns {Function} Function to unsubscribe
 */
export function on(event: string, callback: (data: any) => void): () => void {
  if (!browser) return () => {};
  
  console.log(`Setting up listener for event: ${event}`);
  
  // Initialize set if it doesn't exist
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  
  // Add callback to listeners
  const listeners = eventListeners.get(event)!;
  listeners.add(callback);
  
  // Return unsubscribe function
  return () => {
    console.log(`Removing listener for event: ${event}`);
    listeners.delete(callback);
    
    if (listeners.size === 0) {
      eventListeners.delete(event);
    }
  };
}

/**
 * Check if the socket is connected
 * @returns {boolean} Connection status
 */
export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

/**
 * Get the client ID if connected
 * @returns {string | null} Client ID
 */
export function getClientId(): string | null {
  if (!socket) return null;
  return socket.clientId || null;
}
