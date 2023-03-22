<script lang="ts">
  import Chess from "$lib/chess-engine/chess";
  import Board from "$lib/components/Board.svelte";
  import type { BasicMove, Events } from "$lib/websocket/types";
  import { io } from "socket.io-client";
  const chess = new Chess();
  const socket = io("http://localhost:3000", {
    path: "/ws/",
  });
  socket.on<Events>("connection", (val) => {
    console.log("Message: " + val);
  });
  const sendMove = (move: BasicMove) => {
    socket.emit<Events>("move", move);
  };
</script>

<Board
  {chess}
  on:move={({ detail }) => {
    sendMove(detail);
  }}
/>
