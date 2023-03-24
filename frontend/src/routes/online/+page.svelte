<script lang="ts">
  import type {
    BasicMove,
    Errors,
    Events as Chess_WS_Events,
  } from "$lib/websocket/types";
  import type { PageData } from "./$types";

  import { io } from "socket.io-client";

  import Loading from "$lib/components/Loading.svelte";
  import Chess from "$lib/chess-engine/chess";
  import Board from "$lib/components/Board.svelte";

  type Role = "white" | "black" | "watching";

  // external
  export let data: PageData;

  // internal
  let connectingToWs = true;
  let role: Role | undefined;
  let loadingMessage = "Connecting to game...";
  let watchers = 0;
  let errorMessage = "";
  let lightenBg = false;
  let waitingForPlayer = true;
  let chess = new Chess({
    freezeOn: [],
    onMove: (move) => {
      if (chess.lastMoveColor())
        socket.emit<Chess_WS_Events>("move", {
          from: move.from,
          to: move.to,
          becameTo: move.promoteToType,
        } satisfies BasicMove);
    },
  });

  $: loading = waitingForPlayer || connectingToWs;
  $: flip = role === "black";
  $: {
    if (!data.gameId || !data.roleKey) {
      waitingForPlayer = false;
      connectingToWs = false;
      errorMessage = "Invalid game ID or role KEY!";
      lightenBg = false;
    }
  }

  // socket.io
  const socket = io(
    import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://chess-backend.deno.dev",
    {
      path: "/ws/",
    }
  );

  socket.on<Chess_WS_Events>("connection", () => {
    connectingToWs = false;
    loadingMessage = "Waiting for player to join...";
    if (!data.roleKey || !data.gameId) return;
    socket.emit<Chess_WS_Events>("joinRoom", data.roleKey, data.gameId);
  });

  socket.on<Chess_WS_Events>(
    "connectToGame",
    (
      resRole: Role,
      resMoves: BasicMove[],
      resWatchers: number,
      resWaitingForPlayer
    ) => {
      role = resRole;
      watchers = resWatchers;
      waitingForPlayer = resWaitingForPlayer;
      for (const move of resMoves) {
        // TODO: this can be optimized!
        chess.simulateClicksToMove(move.from, move.to, move.becameTo);
      }
      chess = chess;
    }
  );

  socket.on<Chess_WS_Events>("start", () => {
    waitingForPlayer = false;
    lightenBg = true;
    chess.setRole(role!);
    chess = chess;
  });

  socket.on<Chess_WS_Events>("move", (move: BasicMove) => {
    chess.simulateClicksToMove(move.from, move.to, move.becameTo);
    chess = chess;
  });

  socket.on<Chess_WS_Events>("playerLeave", () => {
    lightenBg = false;
    errorMessage = "One of the player leaves the game..";
  });

  socket.on<Chess_WS_Events>("watcherJoin", () => {
    watchers = watchers + 1;
  });

  socket.on<Chess_WS_Events>("watcherLeave", () => {
    watchers = watchers - 1;
  });

  socket.on<Chess_WS_Events>("error", (error: Errors) => {
    switch (error) {
      case "game-not-found":
        errorMessage =
          "The game link you've entered was not in the current running game list.. maybe it's already ended";
        break;
      case "link-already-clicked":
        errorMessage = "The role cannot be played by two people!";
        break;
    }
  });

  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (errorMessage) return;
    event.preventDefault();
    return (event.returnValue = "");
  };
</script>

<svelte:window on:beforeunload={beforeUnload} />

<div class="overlay {lightenBg ? 'clear' : ''}">
  {#if loading}
    <div class="popup-wrapper">
      <Loading />
      <span style="color: white;">{loadingMessage}</span>
    </div>
  {/if}
  {#if errorMessage}
    <div class="popup-wrapper">
      <div class="error">
        <h2>Error</h2>
        <p>{errorMessage}</p>
      </div>
    </div>
  {/if}
  <div class="watcher">
    <span>{watchers}</span>
  </div>
  <Board {chess} {flip} />
</div>

<style>
  .overlay {
    position: relative;
    display: block;
    background: rgb(0, 0, 0);
  }
  .overlay.clear {
    background: none;
    display: contents;
  }

  .popup-wrapper {
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 10;
  }

  .watcher {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: rgb(236, 235, 233);
    border-radius: 0.1rem;
    overflow-x: hidden;
    height: 2rem;
    width: 2rem;
    transition: width ease-in-out 300ms;
  }
  .watcher span {
    position: absolute;
    line-height: 2rem;
    text-align: center;
    left: 0.75rem;
    pointer-events: none;
  }
  .watcher:hover {
    width: 6.6rem;
  }
  .watcher::after {
    content: " watching";
    position: absolute;
    opacity: 0;
    left: 1.8rem;
    line-height: 2rem;
    pointer-events: none;
    transition: opacity ease-in-out 300ms;
  }
  .watcher:hover.watcher::after {
    opacity: 1;
  }

  .error {
    position: absolute;
    background: white;
    padding: 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 500px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
