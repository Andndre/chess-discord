import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url }) => {
  const roleKey = url.searchParams.get("roleKey");
  const gameId = url.searchParams.get("gameId");

  return {
    roleKey,
    gameId,
  };
};
