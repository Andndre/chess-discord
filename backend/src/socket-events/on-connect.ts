import { Socket } from "socket.io";
import { Events, Role } from "./ws-types";
import { broadcastTo, connections, games } from ".";
import { Move } from "./interfaces";

export function onConnect(socket: Socket) {
  console.log(`socket ${socket.id} connected`);

  socket.emit<Events>("connection", "Hello from server");

  socket.on<Events>("joinRoom", async (roleKey: string, gameId: string) => {
    const game = games.get(gameId);

    if (!game) {
      socket.emit("error", "game-not-found");
      socket.disconnect(true);
      return;
    }

    let res_role: Role | "" = "";
    switch (roleKey) {
      case game.watchKey:
        res_role = "watching";
        broadcastTo(game.watchers, "watcherJoin");
        game.watchers.push(socket);
        broadcastTo([game.white.ws, game.black.ws], "watcherJoin");
        connections.set(socket.id, gameId);
        break;
      case game.black.id:
        res_role = "black";
        if (game.black.ws != undefined) {
          socket.emit<Events>(
            "error",
            "link-already-clicked",
          );
          socket.disconnect(true);
          return;
        }
        connections.set(socket.id, gameId);
        if (game.white.ws) {
          broadcastTo([...game.watchers, game.white.ws], "start");
        }
        game.black.ws = socket;
        break;
      case game.white.id:
        res_role = "white";
        if (game.white.ws != undefined) {
          socket.emit<Events>(
            "error",
            "link-already-clicked",
          );
          socket.disconnect(true);
          return;
        }
        connections.set(socket.id, gameId);
        if (game.black.ws) {
          broadcastTo([...game.watchers, game.black.ws], "start");
        }
        game.white.ws = socket;
        break;
    }

    const waiting = !game.white.ws || !game.black.ws;

    socket.emit<Events>(
      "connectToGame",
      res_role,
      game.moves,
      game.watchers.length,
      waiting,
    );

    if (!waiting) {
      socket.emit<Events>("start");
    }
  });

  socket.on<Events>("move", (move: Move) => {
    const gameId = connections.get(socket.id);
    if (!gameId) return; // TODO:
    const game = games.get(gameId);
    if (!game) return; // TODO:

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
      if (!game) return; // TODO:

      console.log("Saving Moves: " + compiledGame);

      console.log(process.env.SUPABASE_URL);

      fetch(process.env.SUPABASE_URL! + "/rest/v1/game", {
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
    },
  );

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);

    const gameId = connections.get(socket.id);
    connections.delete(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        if (
          game.black.ws?.id === socket.id || game.white.ws?.id === socket.id
        ) {
          // getting enemys websocket
          const enemy = game.white.ws?.id === socket.id
            ? game.black.ws
            : game.white.ws;
          // if the enemy logged out
          if (enemy) {
            // broadcast to all watchers
            broadcastTo(
              [...game.watchers, enemy],
              "playerLeave",
              game.black.ws?.id === socket.id ? "black" : "white",
            );
            // disconnect all watchers from the game
            game.watchers.forEach((w) => {
              w.disconnect(true);
              connections.delete(w.id);
            });
          }

          games.delete(gameId);
        } else {
          // on watcher leave
          const index = game.watchers.indexOf(socket);
          if (index !== -1) {
            // on watcher leave
            game.watchers.splice(index, 1);
            broadcastTo(
              [game.black.ws, game.white.ws, ...game.watchers],
              "watcherLeave",
            );
          }
        }
      }
    }
  });
}
