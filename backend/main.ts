import { serve } from "serve";
import { Server, Socket } from "socket.io";
import { Application, Router } from "oak";
import "dotenv/load.ts";

import { Game, Move } from "./interfaces.ts";
import { Errors, Events } from "./ws-types.ts";

const app = new Application();
const router = new Router()
  .get("/", (ctx) => {
    ctx.response.status = 200;
    ctx.response.body = "Hello world";
  })
  .get("/create", (ctx) => {
    if (ctx.request.headers.get("api-Key") !== Deno.env.get("MY_SECRET")) {
      ctx.response.status = 403;
      ctx.response.body = "No api-Key provided";
      return;
    }

    const whiteId = crypto.randomUUID();
    const blackId = crypto.randomUUID();
    const gameId = crypto.randomUUID();
    const watchKey = crypto.randomUUID();

    games.set(gameId, {
      white: {
        id: whiteId,
      },
      black: {
        id: blackId,
      },
      watchKey: watchKey,
      watchers: [],
      moves: [],
    });

    console.log("set " + games.get(gameId));

    // delete game when no one is playing the game in 3 minutes
    setTimeout(
      () => {
        const game = games.get(gameId);
        if (!game) return;
        broadcast(game.watchers, "playerLeave");
        if (!game.black.ws && !game.white.ws) {
          games.delete(gameId);
          console.log("closing game (" + gameId + ") due to inactivity");
        }
      },
      // 3 minutes
      1000 * 60 * 3,
    );

    const game = {
      gameId,
      whiteId,
      blackId,
      watchKey,
    };

    ctx.response.status = 201;
    ctx.response.body = game;
  });

const games = new Map<string, Game>();
const connections = new Map<string, string>();

const io = new Server({
  path: "/ws/",
  cors: {
    origin: "*",
  },
});

// deno-lint-ignore no-explicit-any
function broadcast(wss: (Socket | undefined)[], event: Events, ...args: any[]) {
  wss.forEach((ws) => {
    ws?.emit<Events>(event, ...args);
  });
}

io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.emit<Events>("connection", "Hello from server");

  socket.on<Events>("joinRoom", (roleKey: string, gameId: string) => {
    const game = games.get(gameId);

    console.log(game);

    if (!game) {
      socket.emit("error", "game-not-found" satisfies Errors);
      socket.disconnect(true);
      return;
    }

    let res_role: "" | "watching" | "black" | "white" = "";
    switch (roleKey) {
      case game.watchKey:
        res_role = "watching";
        broadcast(game.watchers, "watcherJoin");
        game.watchers.push(socket);
        broadcast([game.white.ws, game.black.ws], "watcherJoin");
        connections.set(socket.id, gameId);
        break;
      case game.black.id:
        res_role = "black";
        if (game.black.ws) {
          socket.emit<Events>(
            "error",
            "link-already-clicked" satisfies Errors,
          );
          socket.disconnect(true);
          return;
        }
        connections.set(socket.id, gameId);
        if (game.white.ws) {
          broadcast([...game.watchers, game.white.ws], "start");
        }
        game.black.ws = socket;
        break;
      case game.white.id:
        res_role = "white";
        if (game.white.ws) {
          socket.emit<Events>(
            "error",
            "link-already-clicked",
          );
          socket.disconnect(true);
          return;
        }
        connections.set(socket.id, gameId);
        if (game.black.ws) {
          broadcast([...game.watchers, game.black.ws], "start");
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
      console.log("black is moving");
      game.white.ws!.emit<Events>("move", move);
    } else if (game.white.ws?.id === socket.id) {
      console.log("white is moving");
      game.black.ws!.emit<Events>("move", move);
    }
    broadcast(game.watchers, "move", move);
  });

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);

    const gameId = connections.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        if (game.black.ws == socket || game.white.ws == socket) {
          const enemy = game.white.ws === socket
            ? game.black.ws
            : game.white.ws;
          if (enemy) {
            broadcast(
              [...game.watchers, enemy],
              "playerLeave",
              game.black.ws?.id === socket.id ? "black" : "white",
            );
            game.watchers.forEach((w) => {
              w.disconnect(true);
            });
          }
          // maybe save to a database here
          games.delete(gameId);
        } else {
          const index = game.watchers.indexOf(socket);
          if (index !== -1) {
            // on watcher leave
            game.watchers.splice(index, 1);
            broadcast(
              [game.black.ws, game.white.ws, ...game.watchers],
              "watcherLeave",
            );
          }
        }
      }
    }
  });
});

app.use(router.routes());

const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 404 });
});

await serve(handler, {
  port: Number(Deno.env.get("PORT")) || 3000,
});
