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
  const frontend = Deno.env.get("FRONT_END_URL")!;
  const backend = Deno.env.get("BACK_END_URL")!;

  const userId = interaction.member.user.id;

  const response = await fetch(`${backend}create`, {
    method: "POST",
    headers: {
      "api-Key": Deno.env.get("MY_SECRET") || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      whiteId: userId,
      blackId: taggedId,
    }),
  });

  const game = await response.json() as {
    gameId: string;
  };

  const gameUrl = `${frontend}online?gameId=${game.gameId}`;

  return {
    content: `<@${userId}> vs <@${taggedId}>`,
    components: [
      createActionRow([
        createButton(
          "Lets Go!",
          ButtonStyleTypes.LINK,
          gameUrl,
        ),
      ]),
    ],
  };
};

// async function sendDM(recipient_id: string, content: string) {
//   const options = {
//     method: "POST",
//     headers: {
//       "Authorization": `Bot ${Deno.env.get("TOKEN") || ""}`,
//       "Content-Type": "application/json",
//     },
//   };
//   const channelResponse = await fetch(
//     `${discordAPI}users/@me/channels`,
//     {
//       ...options,
//       body: JSON.stringify({
//         recipient_id,
//       }),
//     },
//   );

//   if (!channelResponse.ok) return false;

//   const channel = await channelResponse.json();

//   const dirrectMessage = await fetch(
//     `${discordAPI}channels/${channel.id}/messages`,
//     {
//       ...options,
//       body: JSON.stringify({
//         content,
//       }),
//     },
//   );

//   return dirrectMessage.ok;
// }
