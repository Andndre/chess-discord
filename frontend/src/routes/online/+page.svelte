<script lang="ts">
  import type { BasicMove, Events } from "$lib/websocket/types";
  import type { PageData } from "./$types";
  import { io } from "socket.io-client";

  import Loading from "$lib/components/Loading.svelte";

  import Chess from "$lib/chess-engine/chess";
  import Board from "$lib/components/Board.svelte";

  // external
  export let data: PageData;

  // internal
  let connectingToWs = true;

  const chess = new Chess({
    freezeOn: [],
    onMove: (move) => {
      if (chess.lastMoveColor())
        socket.emit<Events>("move", {
          from: move.from,
          to: move.to,
          becameTo: move.promoteToType,
        } satisfies BasicMove);
    },
  });

  const socket = io(
    import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://chess-backend.deno.dev",
    {
      path: "/ws/",
    }
  );

  socket.on<Events>("connection", (val) => {
    console.log("Message: " + val);
    connectingToWs = false;
    console.log(data.gameId, data.roleKey);
  });

  const beforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    return (event.returnValue = "");
  };
</script>

<svelte:window on:beforeunload={beforeUnload} />

<div class="bg {!connectingToWs ? 'connected' : ''}">
  <div class="absolute-center">
    <Loading />
  </div>
  <Board {chess} />
</div>

<style>
  .bg {
    position: relative;
    display: block;
    background: rgb(0, 0, 0);
  }
  .bg.connected {
    background: none;
    display: contents;
  }
  .absolute-center {
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 10;
  }
  .connected .absolute-center {
    display: none;
  }
</style>
