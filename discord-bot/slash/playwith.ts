import { ButtonStyleTypes } from "../utils/interactions.ts";
import {
  AppCommandInteraction,
  createActionRow,
  createButton,
  SlashCommandHandler,
} from "../utils/mod.ts";

const discordAPI = "https://discord.com/api/v9/";

export const playWith: SlashCommandHandler = async (
  interaction: AppCommandInteraction,
) => {
  if (!interaction.data.options) {
    // no args were passed (cannot happen since the options are required)
    return {
      content: "",
    };
  }

  const taggedId = interaction.data.options[0].value;
  const taggedUser = interaction.data.resolved?.users[taggedId];

  if (!taggedUser) {
    // not sure why
    return {
      content: "Tagged user does not exist",
    };
  }

  if (taggedUser.bot) {
    return {
      content: "Cannot play with bot!",
    };
  }

  const prod = Deno.env.get("PROD");
  const frontend = prod
    ? "https://chess-discord.vercel.app/"
    : "http://localhost:5173/";
  const backend = prod
    ? "https://chess-backend.deno.dev/"
    : "http://localhost:3000/";

  const userId = interaction.member.user.id;

  const response = await fetch(`${backend}create`, {
    method: "GET",
    headers: {
      "api-Key": Deno.env.get("MY_SECRET") || "",
      "Content-Type": "application/json",
    },
  });

  const game = await response.json() as {
    gameId: string;
    whiteId: string;
    blackId: string;
    watchKey: string;
  };

  const baseUrl = `${frontend}online?gameId=${game.gameId}&roleKey=`;
  const watchUrl = baseUrl + game.watchKey;
  const whiteUrl = baseUrl + game.whiteId;
  const blackUrl = baseUrl + game.blackId;

  const playerMessage =
    "Hello, here is your game link (do not share it with anyone before you clicked it): ";

  const [first, second] = await Promise.all([
    sendDM(userId, playerMessage + whiteUrl),
    sendDM(taggedId, playerMessage + blackUrl),
  ]);

  if (!first || !second) {
    return {
      content: "Failed to send DM",
    };
  }

  return {
    content: `<@${userId}> vs <@${taggedId}>`,
    components: [
      createActionRow([
        createButton(
          "Go watch!",
          ButtonStyleTypes.LINK,
          watchUrl,
        ),
      ]),
    ],
  };
};

async function sendDM(recipient_id: string, content: string) {
  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bot ${Deno.env.get("TOKEN") || ""}`,
      "Content-Type": "application/json",
    },
  };
  const channelResponse = await fetch(
    `${discordAPI}users/@me/channels`,
    {
      ...options,
      body: JSON.stringify({
        recipient_id,
      }),
    },
  );

  if (!channelResponse.ok) return false;

  const channel = await channelResponse.json();

  const dirrectMessage = await fetch(
    `${discordAPI}channels/${channel.id}/messages`,
    {
      ...options,
      body: JSON.stringify({
        content,
      }),
    },
  );

  return dirrectMessage.ok;
}
