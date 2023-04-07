import { Request, Response } from "express";
import { broadcastTo, games } from "../socket-events";
import crypto from "crypto";

export default (_req: Request, res: Response) => {
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

  console.log("game set");

  // delete game when no one is playing the game in 3 minutes
  setTimeout(
    () => {
      const game = games.get(gameId);
      if (!game) return;
      broadcastTo(game.watchers, "playerLeave");
      if (!game.black.ws && !game.white.ws) {
        games.delete(gameId);
        console.log("closing game (" + gameId + ") due to inactivity");
      }
    },
    // 3 minutes
    1000 * 60 * 3,
  );

  res.status(201).send({
    gameId,
    whiteId,
    blackId,
    watchKey,
  });
};
