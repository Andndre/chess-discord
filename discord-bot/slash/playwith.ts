import { ButtonStyleTypes } from "discord-interactions";
import {
  AppCommandInteraction,
  createActionRow,
  createButton,
  MyResponse,
  sendChannelMessage,
  sendChannelMessageText,
  SlashCommandHandler,
} from "../utils/mod.ts";

export const playWith: SlashCommandHandler = (
  interaction: AppCommandInteraction,
  res: MyResponse,
) => {
  if (!interaction.data.options) {
    // no args were passed
    return;
  }

  const taggedId = interaction.data.options[0].value;
  const taggedUser = interaction.data.resolved?.users[taggedId];

  if (!taggedUser) {
    // not sure why
    console.log("Tagged user does not exist");
    return;
  }

  if (taggedUser.bot) {
    sendChannelMessageText(res, "Cannot play with bot!");
    return;
  }

  const userId = interaction.member.user.id;

  sendChannelMessage(res, {
    content: `<@${userId}> vs <@${taggedId}>`,
    components: [
      createActionRow([
        createButton(
          "Go watch!",
          ButtonStyleTypes.LINK,
          "https://www.google.com",
        ),
      ]),
    ],
  });
};
