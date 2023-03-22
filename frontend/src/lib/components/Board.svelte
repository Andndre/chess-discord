<script lang="ts">
  import type Chess from "$lib/chess-engine/chess";
  import type { Move } from "$lib/chess-engine/move";
  import { PieceType } from "$lib/chess-engine/piece";
  import {
    getOverlayColor,
    getTileBackgroundColor,
    twoDimensionalOffset,
  } from "$lib/chess-engine/renderingHelpers";
  import type { BasicMove } from "$lib/websocket/types";
  import { createEventDispatcher } from "svelte";

  interface ChessEvents {
    move: BasicMove;
  }

  const dispatch = createEventDispatcher<ChessEvents>();

  export let chess: Chess;
  chess.onMove = (move: Move) => {
    dispatch("move", {
      from: move.from,
      to: move.to,
      becameTo: move.promoteToType,
    } satisfies BasicMove);
  };
  let promoteOffset = -1;
  const promoteTypes = [
    [PieceType.QUEEN, PieceType.BISHOP],
    [PieceType.KNIGHT, PieceType.ROOK],
  ];
</script>

<div class="board">
  {#each twoDimensionalOffset as row}
    <div class="row">
      {#each row as offset}
        {#if offset === promoteOffset}
          <div class="cell">
            {#each promoteTypes as pRow}
              <div class="promote">
                {#each pRow as type}
                  <button
                    style="background: {getTileBackgroundColor(offset)};"
                    on:click={() => {
                      chess.promoteLastMoveTo(type);
                      chess.next();
                      promoteOffset = -1;
                      chess = chess;
                    }}
                  >
                    <img src="/{type}{chess.current}.png" alt="piece" />
                  </button>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <button
            on:click={() => {
              if (chess.clickTile(offset) === "move") {
                if (chess.isPromote()) {
                  promoteOffset = offset;
                } else {
                  chess.next();
                }
              }
              chess = chess;
            }}
            class="cell"
            style="background: {getTileBackgroundColor(offset)};"
          >
            <!-- <p style="position: absolute;">{chess.board[offset].moved}</p> -->
            <div
              class="overlay"
              style="background: {getOverlayColor(offset, chess)};"
            >
              {#if chess.board[offset].type !== PieceType.NONE}
                <img
                  src="/{chess.board[offset].type}{chess.board[offset]
                    .color}.png"
                  alt="piece"
                />
              {/if}
            </div>
          </button>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    width: 100%;
    flex: 1;
  }

  .cell .promote {
    /* position: relative; */
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 50%;
  }

  .cell .promote button {
    aspect-ratio: 1 / 1;
    border: 1;
    padding: 0;
    width: 100%;
  }

  .cell {
    border: 0;
    flex: 1;
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    padding: 0;
  }

  .cell img {
    width: 100%;
  }

  .cell .overlay {
    width: 100%;
    height: 100%;
  }
</style>
