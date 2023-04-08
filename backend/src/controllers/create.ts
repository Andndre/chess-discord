import { Request, Response } from "express";
import { broadcastTo, games } from "../socket-events";
import crypto from "crypto";

export default (req: Request, res: Response) => {
  const gameId = crypto.randomUUID();
  const { whiteId, blackId } = req.body as {
    whiteId: string;
    blackId: string;
  };

  games.set(gameId, {
    white: {
      id: whiteId,
    },
    black: {
      id: blackId,
    },
    watchers: [],
    moves: [],
  });

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
  });
};
