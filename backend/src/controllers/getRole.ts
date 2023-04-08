import { Request, Response } from "express";
import { games } from "../socket-events";

export default async (req: Request, res: Response) => {
  const { gameId, userId } = req.body as { gameId: string; userId: string };

  console.log({ gameId, userId });

  const game = games.get(gameId);
  if (!game) {
    console.log("game not found");

    res.sendStatus(404);
    return;
  }

  let role = "watching";

  switch (userId) {
    case game.white.id:
      role = "white";
      break;
    case game.black.id:
      role = "black";
      break;
  }

  res.status(200).send(JSON.stringify({ role }));
};
