import { DI, utils } from "../deps.ts";

export const playWith: utils.SlashCommandHandler = (
  interaction: utils.AppCommandInteraction,
  res: utils.MyResponse,
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
    utils.sendChannelMessageText(res, "Cannot play with bot!");
    return;
  }

  const player_one = interaction.member.user.username;
  const player_two = taggedUser.username;

  //   if (player_one === player_two) {
  //     sendChannelMessageText(res, "Cannot play with yourself!");
  //     return;
  //   }

  utils.sendChannelMessage(res, {
    content: `${player_one} vs ${player_two}!`,
    components: [
      utils.createActionRow([
        utils.createButton("Go watch!", DI.ButtonStyleTypes.LINK, ""),
      ]),
    ],
  });
};
