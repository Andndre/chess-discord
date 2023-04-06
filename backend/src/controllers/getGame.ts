import { Request, Response } from "express";

export default async (req: Request, res: Response) => {
  const response = await fetch(
    process.env.SUPABASE_URL! + "/rest/v1/game?gameId=eq." + req.query.gameId,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_KEY!}`,
        "apiKey": process.env.SUPABASE_KEY!,
      },
    },
  );
  const game = await response.json() as {
    gameId: string;
    compiledGame: string;
  };

  console.log(game);

  res.send(game);
};
