import { utils } from "../deps.ts";

export const playWith: utils.SlashCommandHandler = (
  interaction: utils.AppCommandInteraction,
  res: utils.MyResponse,
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
    utils.sendChannelMessageText(res, "Cannot play with bot!");
    return;
  }

  const userId = interaction.member.user.id;

  utils.sendChannelMessage(res, {
    content: `<@${userId}> vs <@${taggedId}>`,
    components: [
      utils.createActionRow([
        utils.createButton(
          "Go watch!",
          5, // 5 for LINK
          "https://www.google.com",
        ),
      ]),
    ],
  });
};
