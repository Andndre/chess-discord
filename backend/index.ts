import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { Server, Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import "https://deno.land/std@0.180.0/dotenv/load.ts";

import { Game } from "./interfaces.ts";
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

    ctx.response.status = 201;
    ctx.response.body = {
      gameId,
      whiteId,
      blackId,
      watchKey,
    };
  });

const games = new Map<string, Game>();
const connections = new Map<string, string>();

const io = new Server({
  path: "/ws/",
});

// deno-lint-ignore no-explicit-any
function broadcast(wss: (Socket | undefined)[], event: Events, ...args: any[]) {
  wss.forEach((ws) => {
    ws?.emit<Events>(event, ...args);
  });
}

io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.on<Events>("joinRoom", (roleKey: string, gameId: string) => {
    const game = games.get(gameId);

    if (!game) {
      socket.emit("error", "game-not-found" as Errors);
      socket.disconnect(true);
      return;
    }

    let res_role = "";
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

    socket.emit<Events>(
      "connectToGame",
      res_role,
      game.moves,
      game.watchers.length,
      !game.white.ws || !game.black.ws,
    );
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
              game.black.ws === socket ? "black" : "white",
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
            broadcast([game.black.ws, game.white.ws], "watcherLeave");
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
