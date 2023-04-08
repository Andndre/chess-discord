import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "$env/static/private";
import type { User } from "$lib/types";
import type { Cookies } from "@sveltejs/kit";

export function isLoggedIn(cookie: Cookies) {
  return cookie.get("discord_refresh_session") !== undefined;
}

export async function refreshSession(cookie: Cookies) {
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:
      `client_id=${DISCORD_CLIENT_ID}&client_secret=${DISCORD_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${
        cookie.get(
          "discord_refresh_session",
        )
      }`,
  });

  const data = await response.json();

  cookie.set("discord_session", data.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    expires: new Date(Date.now() + data.expires_in * 1000),
  });
}

export async function getDiscordUser(cookie: Cookies) {
  const me = await fetch(
    "https://discord.com/api/users/@me",
    {
      headers: {
        Authorization: `Bearer ${cookie.get("discord_session")}`,
      },
    },
  );

  return await me.json() as User;
}

export async function getAuthUser(cookie: Cookies) {
  const discord_session = cookie.get("discord_session");
  const discord_refresh_session = cookie.get("discord_refresh_session");

  if (discord_refresh_session) {
    if (!discord_session) {
      await refreshSession(cookie);
    }
    return await getDiscordUser(cookie);
  }
  return null;
}
