<script lang="ts">
  import { PieceColor } from "$lib/chess-engine/piece";
  import type { PageData } from "./$types";
  import type { Move } from "$lib/chess-engine/move";

  import Board from "$lib/components/Board.svelte";
  import Chess from "$lib/chess-engine/chess";
  import { Arrays } from "$lib/chess-engine/utils";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  export let data: PageData;
  let chess = new Chess({
    freezeOn: [PieceColor.BLACK, PieceColor.WHITE],
  });

  onMount(() => {
    if (!data.gameId) {
      goto("/404");
    }
  });

  let history: Move[] = [];
  const moveCount = loadGameFromCompiledString(data.compiledGame);
  let currentIndex = moveCount;

  function loadGameFromCompiledString(compiledString: string) {
    const lines = compiledString.split("\n");
    let moveCount = lines.length - 1;
    for (const line of lines) {
      const [from, to, promoteToType] = line.split(",");
      chess.simulateClicksToMove(
        +from,
        +to,
        promoteToType !== "undefined" ? +promoteToType : undefined
      );
      history.push(Arrays.last(chess.moveHistory)!);
    }
    return moveCount;
  }

  function back() {
    if (currentIndex === 0) {
      return false;
    }
    currentIndex = currentIndex - 1;
    chess.undo();
    return true;
  }

  function goToBeginning() {
    while (back());
  }

  function forward() {
    if (currentIndex === moveCount) {
      return false;
    }
    const move = history[currentIndex];
    currentIndex++;
    chess.simulateClicksToMove(move.from, move.to, move.promoteToType);
    return true;
  }

  function goToEnd() {
    while (forward());
  }
</script>

<div class="page">
  <header>
    <div class="group">
      <button
        on:click={() => {
          goToBeginning();
          chess = chess;
        }}>Beginning</button
      >
      <button
        on:click={() => {
          back();
          chess = chess;
        }}>Back</button
      >
    </div>
    <p>{currentIndex}/{moveCount} Moves</p>
    <div class="group">
      <button
        on:click={() => {
          forward();
          chess = chess;
        }}>Forward</button
      >
      <button
        on:click={() => {
          goToEnd();
          chess = chess;
        }}>End</button
      >
    </div>
  </header>
  <Board {chess} flip={false} />
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    padding: 1rem;
    background: #b57d45;
  }
  .group {
    display: flex;
    gap: 1rem;
  }
  header button {
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    /* gap: 0.5rem; */
  }
</style>
