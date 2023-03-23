import {
  sendChannelMessage,
  sendChannelMessageText,
} from "../utils/messages.ts";

import type {
  AppCommandInteraction,
  MyResponse,
  SlashCommandHandler,
} from "../utils/types.ts";

import { ButtonStyleTypes } from "npm:discord-interactions";
import { createActionRow, createButton } from "../utils/components.ts";

export const playWith: SlashCommandHandler = (
  interaction: AppCommandInteraction,
  res: MyResponse,
) => {
  if (!interaction.data.options) {
    // no args were passed
    return;
  }

  const id = interaction.data.options[0].value;
  const taggedUser = interaction.data.resolved?.users[id];

  if (!taggedUser) {
    // not sure why
    console.log("Tagged user does not exist");
    return;
  }

  if (taggedUser.bot) {
    sendChannelMessageText(res, "Cannot play with bot!");
    return;
  }

  const player_one = interaction.member.user.username;
  const player_two = taggedUser.username;

  //   if (player_one === player_two) {
  //     sendChannelMessageText(res, "Cannot play with yourself!");
  //     return;
  //   }

  sendChannelMessage(res, {
    content: `${player_one} vs ${player_two}!`,
    components: [
      createActionRow([
        createButton("Go watch!", ButtonStyleTypes.LINK, ""),
      ]),
    ],
  });
};
