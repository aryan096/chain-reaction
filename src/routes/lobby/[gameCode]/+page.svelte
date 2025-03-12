<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getLobbyInfo, startGame, leaveLobby, updatePlayerName } from '$lib/gameService';
  import * as socketService from '$lib/socketService';
  import { playerStore } from '$lib/gameService';
  import type { Player, GameSettings } from '$lib/types';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  
  const gameCode = $page.params.gameCode;
  
  let players: Player[] = [];
  let isHost = false;
  let gameSettings: GameSettings = { gridSizeX: 0, gridSizeY: 0, playerCount: 0 };
  let copySuccess = false;
  let isStarting = false;
  
  // For name editing
  let isEditingName = false;
  let newName = '';
  let nameError = '';
  let isSavingName = false;
  
  // Get current player info
  let currentPlayerId = '';
  
  // Setup real-time connection for lobby updates
  let unsubscribe: (() => void) | undefined;
  let gameStartedUnsubscribe: (() => void) | undefined;
  
  onMount(async () => {
    // Subscribe to lobby updates
    unsubscribe = getLobbyInfo(gameCode, (data) => {
      players = data.players;
      isHost = data.isHost;
      gameSettings = data.settings;
    });
    
    // Listen for game-started event
    gameStartedUnsubscribe = socketService.on('game-started', (data) => {
      console.log('Game started event received in lobby:', data);
      if (data && data.gameCode === gameCode) {
        console.log(`Redirecting to game/${gameCode}`);
        goto(`/game/${gameCode}`);
      }
    });
    
    // Get player info
    const unsubscribePlayer = playerStore.subscribe(player => {
      currentPlayerId = player.id || '';
      newName = player.name;
    });
    
    return () => {
      unsubscribePlayer();
    };
  });
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
    if (gameStartedUnsubscribe) gameStartedUnsubscribe();
  });
  
  function copyGameCode(): void {
    navigator.clipboard.writeText(gameCode);
    copySuccess = true;
    setTimeout(() => copySuccess = false, 2000);
  }
  
  async function handleStartGame(): Promise<void> {
    if (isStarting) return;
    
    try {
      isStarting = true;
      await startGame(gameCode);
      // No need to navigate here - we'll be redirected by the game-started event
    } catch (error) {
      console.error('Error starting game:', error);
      isStarting = false;
    }
  }
  
  async function handleLeaveGame(): Promise<void> {
    await leaveLobby(gameCode);
    goto('/');
  }
  
  function startEditingName(): void {
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    if (currentPlayer) {
      newName = currentPlayer.name;
      isEditingName = true;
      nameError = '';
    }
  }
  
  async function savePlayerName(): Promise<void> {
    if (!newName.trim()) {
      nameError = 'Name cannot be empty';
      return;
    }
    
    try {
      isSavingName = true;
      nameError = '';
      await updatePlayerName(gameCode, newName.trim());
      isEditingName = false;
    } catch (error) {
      if (error instanceof Error) {
        nameError = error.message;
      } else {
        nameError = 'Failed to update name';
      }
    } finally {
      isSavingName = false;
    }
  }
  
  function cancelEditName(): void {
    isEditingName = false;
    nameError = '';
  }
</script>

<div class="flex flex-col pt-12 md:pt-0 lg:pt-0 items-center justify-start md:justify-center lg:justify-center min-h-screen bg-gray-900">
  <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
    <h1 class="text-3xl font-bold mb-6 text-center">Game Lobby</h1>
    
    <div class="flex justify-between items-center mb-6">
      <div>
        <span class="font-bold">Game Code:</span> 
        <span class="text-blue-600 text-xl ml-2">{gameCode}</span>
      </div>
      
      <button 
        class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded text-sm flex items-center"
        on:click={copyGameCode}
      >
        {copySuccess ? 'Copied!' : 'Copy'}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
      </button>
    </div>
    
    <div class="bg-gray-100 p-3 rounded-md mb-6">
      <h3 class="font-bold mb-1">Game Settings</h3>
      <p>Grid Size: {gameSettings.gridSizeX} x {gameSettings.gridSizeY}</p>
      <p>Players: {players.length} / {gameSettings.playerCount}</p>
    </div>
    
    <!-- Your settings section -->
    <div class="mb-6 bg-blue-50 p-3 rounded-md">
      <h3 class="font-bold mb-2">Your Settings</h3>
      {#if isEditingName}
        <div class="flex flex-col">
          <label for="player-name" class="text-sm text-gray-600 mb-1">Your Name:</label>
          <div class="flex items-center">
            <input 
              type="text"
              id="player-name"
              bind:value={newName}
              class="border rounded px-2 py-1 flex-1 mr-2"
              placeholder="Enter your name"
            />
            <button 
              class="bg-teal-500 hover:bg-teal-600 text-white py-1 px-2 rounded-md text-sm flex items-center"
              on:click={savePlayerName}
              disabled={isSavingName}
            >
              {#if isSavingName}
                <svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              {/if}
              Save
            </button>
            <button 
              class="bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-2 rounded-md text-sm ml-2"
              on:click={cancelEditName}
              disabled={isSavingName}
            >
              Cancel
            </button>
          </div>
          {#if nameError}
            <p class="text-rose-500 text-sm mt-1">{nameError}</p>
          {/if}
        </div>
      {:else}
        <div class="flex justify-between items-center">
          <div>
            <span class="text-sm text-gray-600">Your Name: </span>
            <span class="font-medium">{players.find(p => p.id === currentPlayerId)?.name || 'Unknown'}</span>
          </div>
          <button 
            class="text-blue-500 hover:text-blue-700 text-sm flex items-center"
            on:click={startEditingName}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
        </div>
      {/if}
    </div>
    
    <div class="mb-6">
      <h3 class="font-bold mb-2">Players:</h3>
      <div class="space-y-1">
        {#each players as player}
          <div class="flex items-center p-2 bg-gray-50 rounded">
            <div class="w-3 h-3 rounded-full mr-2" style="background-color: {player.color}"></div>
            <span>{player.name} {player.isHost ? '(Host)' : ''} {player.id === currentPlayerId ? '(You)' : ''}</span>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded"
        on:click={handleLeaveGame}
        disabled={isStarting}
      >
        Leave
      </button>
      
      {#if isHost}
        <button 
          class="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center min-w-32"
          on:click={handleStartGame}
          disabled={players.length < 2 || isStarting}
        >
          {#if isStarting}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Starting...
          {:else}
            {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          {/if}
        </button>
      {:else}
        <div class="text-gray-500 italic">Waiting for host to start game...</div>
      {/if}
    </div>
  </div>
  
  <!-- Add the enhanced ConnectionStatus component with debug mode -->
  <ConnectionStatus debug={true} />
</div>
