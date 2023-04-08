import { MY_SECRET } from "$env/static/private";
import {
  PUBLIC_BACK_END_URL,
  PUBLIC_DISCORD_OAUTH_URL,
} from "$env/static/public";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user) {
    throw redirect(302, PUBLIC_DISCORD_OAUTH_URL);
  }

  const gameId = url.searchParams.get("gameId");

  console.log({ gameId });

  const response = await fetch(`${PUBLIC_BACK_END_URL}getRole`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-Key": MY_SECRET,
    },
    body: JSON.stringify({ gameId, userId: locals.user.id }),
  });

  const { role } = await response.json() as { role: string };

  console.log({ role });

  return {
    role,
    gameId,
  };
};
