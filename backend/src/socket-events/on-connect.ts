import { Socket } from "socket.io";
import { Events, Role } from "./ws-types";
import { broadcastTo, connections, games } from ".";
import { Game, Move } from "./interfaces";

export function onConnect(socket: Socket) {
  console.log(`socket ${socket.id} connected`);

  socket.emit<Events>("connection", "Hello from server");

  socket.on<Events>(
    "joinRoom",
    async (role: "black" | "white" | "watching", gameId: string) => {
      const game = games.get(gameId);

      if (!game) {
        socket.emit("error", "game-not-found");
        socket.disconnect(true);
        return;
      }

      switch (role) {
        case "watching":
          broadcastTo(game.watchers, "watcherJoin");
          game.watchers.push(socket);
          broadcastTo([game.white.ws, game.black.ws], "watcherJoin");
          connections.set(socket.id, gameId);
          break;
        case "black":
          if (game.black.ws != undefined) {
            // rejoin
            connections.delete(game.black.ws.id);
            game.black.ws = socket;
            connections.set(socket.id, gameId);

            broadcastTo(
              [game.white.ws, ...game.watchers],
              "blackOnline",
            );
          }
          connections.set(socket.id, gameId);
          game.black.ws = socket;
          if (game.white.ws) {
            broadcastTo([...game.watchers, game.white.ws], "start");
          }
          break;
        case "white":
          if (game.white.ws != undefined) {
            // rejoin
            connections.delete(game.white.ws.id);
            game.white.ws = socket;
            connections.set(socket.id, gameId);

            broadcastTo(
              [game.black.ws, ...game.watchers],
              "whiteOnline",
            );
          }

          connections.set(socket.id, gameId);
          game.white.ws = socket;
          if (game.black.ws) {
            broadcastTo([...game.watchers, game.black.ws], "start");
          }
          break;
      }

      const waiting = !game.white.ws || !game.black.ws;

      socket.emit<Events>(
        "connectToGame",
        role,
        game.moves,
        game.watchers.length,
        waiting,
      );

      if (!waiting) {
        socket.emit<Events>("start");
      }
    },
  );

  socket.on<Events>("move", (move: Move) => {
    const gameId = connections.get(socket.id);
    if (!gameId) return;
    const game = games.get(gameId);
    if (!game) return;

    game.moves.push(move);

    if (game.black.ws?.id === socket.id) {
      game.white.ws!.emit<Events>("move", move);
    } else if (game.white.ws?.id === socket.id) {
      game.black.ws!.emit<Events>("move", move);
    }
    broadcastTo(game.watchers, "move", move);
  });

  socket.on<Events>("gameOver", (reason: string) => {
    const gameId = connections.get(socket.id);
    if (!gameId) return; // TODO:
    const game = games.get(gameId);
    if (!game) return; // TODO:
    broadcastTo(
      [...game.watchers, game.black.ws, game.white.ws],
      "gameOver",
      reason,
    );
  });

  socket.on<Events>(
    "uploadMove",
    (gameId: string, compiledGame: string) => {
      const game = games.get(gameId);
      if (!game) return;
      uploadMove(gameId, compiledGame);
      deleteGame(game, gameId);
    },
  );

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
    connections.delete(socket.id);

    const gameId = connections.get(socket.id);
    if (!gameId) return;

    const game = games.get(gameId);
    if (game) {
      if (
        game.black.ws?.id === socket.id || game.white.ws?.id === socket.id
      ) {
        playerLeave(socket, game, gameId);
      } else {
        watcherLeave(socket, game);
      }
    }
  });
}

function deleteGame(game: Game, gameId: string) {
  for (const ws of game.watchers) {
    ws.disconnect(true);
    connections.delete(ws.id);
  }

  game.black.ws?.disconnect(true);
  game.white.ws?.disconnect(true);

  if (game.black.ws) {
    connections.delete(game.black.ws?.id);
  }
  if (game.white.ws) {
    connections.delete(game.white.ws?.id);
  }
  games.delete(gameId);
}

function getEnemyWS(socket: Socket, game: Game) {
  return game.white.ws?.id === socket.id ? game.black.ws : game.white.ws;
}

function playerLeave(socket: Socket, game: Game, gameId: string) {
  const enemy = getEnemyWS(socket, game);

  broadcastTo(
    [...game.watchers, enemy],
    "playerLeave",
    game.black.ws?.id === socket.id ? "black" : "white",
  );

  if (enemy) {
    setTimeout(() => {
      const current = getEnemyWS(enemy, game);
      if (!current) {
        broadcastTo([...game.watchers, enemy], "error", "player-leave");
        deleteGame(game, gameId);
        return;
      }
    }, 1000 * 15); // 15 seconds
  }
}

function watcherLeave(socket: Socket, game: Game) {
  const index = game.watchers.findIndex((w) => w.id === socket.id);
  if (index === -1) return;

  game.watchers.splice(index, 1);
  broadcastTo(
    [game.black.ws, game.white.ws, ...game.watchers],
    "watcherLeave",
  );
}

async function uploadMove(gameId: string, compiledGame: string) {
  await fetch(process.env.SUPABASE_URL! + "/rest/v1/game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_KEY!}`,
      "apiKey": process.env.SUPABASE_KEY!,
    },
    body: JSON.stringify([{
      gameId,
      compiledGame,
    }]),
  });
}
