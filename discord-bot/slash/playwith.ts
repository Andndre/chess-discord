import { ButtonStyleTypes } from "../utils/interactions.ts";
import {
  AppCommandInteraction,
  createActionRow,
  createButton,
  SlashCommandHandler,
} from "../utils/mod.ts";

export const playWith: SlashCommandHandler = (
  interaction: AppCommandInteraction,
) => {
  if (!interaction.data.options) {
    // no args were passed
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

  const userId = interaction.member.user.id;

  return {
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
  };
};
