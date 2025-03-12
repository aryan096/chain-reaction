<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getGameState, makeMove, leaveGame } from '$lib/gameService';
  import GameBoard from '$lib/components/GameBoard.svelte';
  import PlayerInfo from '$lib/components/PlayerInfo.svelte';
  import type { GameState, Player } from '$lib/types';
  
  const gameCode = $page.params.gameCode;
  
  let gameState: GameState | null = null;
  let players: Player[] = [];
  let currentPlayer: Player | null = null;
  let isMyTurn = false;
  let gameOver = false;
  let winner: Player | null = null;
  
  let unsubscribe: (() => void) | undefined;
  
  onMount(async () => {
    unsubscribe = getGameState(gameCode, (state) => {
      gameState = state;
      players = state.players;
      currentPlayer = state.currentPlayer;
      isMyTurn = state.isMyTurn;
      gameOver = state.gameOver;
      winner = state.winner;
    });
  });
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
  
  async function handleCellClick(x: number, y: number): Promise<void> {
    if (isMyTurn && !gameOver) {
      await makeMove(gameCode, x, y);
    }
  }
  
  async function handleLeaveGame(): Promise<void> {
    await leaveGame(gameCode);
    goto('/');
  }
  
  function handleNewGame(): void {
    goto('/');
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 p-4">
  <div class="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Chain Reaction</h1>
      <div class="text-sm bg-gray-100 px-3 py-1 rounded-md">
        Game Code: <span class="font-bold">{gameCode}</span>
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row gap-6">
      <div class="md:w-3/4">
        {#if gameState}
          <GameBoard 
            grid={gameState.grid} 
            gridSizeX={gameState.settings.gridSizeX} 
            gridSizeY={gameState.settings.gridSizeY}
            onCellClick={handleCellClick}
            {currentPlayer}
            {isMyTurn}
            players={players}
          />
        {:else}
          <div class="flex items-center justify-center h-64">
            <p>Loading game...</p>
          </div>
        {/if}
      </div>
      
      <div class="md:w-1/4">
        <PlayerInfo {players} {currentPlayer} />
        
        {#if gameOver && winner}
          <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mt-4">
            <p class="font-bold">Game Over!</p>
            <p>Winner: {winner.name}</p>
            <button 
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full mt-4"
              on:click={handleNewGame}
            >
              New Game
            </button>
          </div>
        {/if}
        
        <button 
          class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full mt-4"
          on:click={handleLeaveGame}
        >
          Leave Game
        </button>
      </div>
    </div>
  </div>
</div>
