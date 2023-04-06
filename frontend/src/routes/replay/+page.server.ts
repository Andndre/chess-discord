import type { PageServerLoad } from "./$types";
import { MY_SECRET } from "$env/static/private";
import { PUBLIC_BACK_END_URL } from "$env/static/public";

export const load: PageServerLoad = async ({ url }) => {
  const gameId = url.searchParams.get("gameId");

  const response = await fetch(
    `${PUBLIC_BACK_END_URL}getGame?gameId=${gameId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-Key": MY_SECRET,
      },
    },
  );
  const game = await response.json() as [{
    gameId: string;
    compiledGame: string;
  }];

  return {
    gameId: game[0].gameId,
    compiledGame: game[0].compiledGame,
  };
};
