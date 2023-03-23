import { AppCommandInteraction, SlashCommandHandler } from "../utils/mod.ts";

export const ping: SlashCommandHandler = (
  _interaction: AppCommandInteraction,
) => {
  return {
    content: "pong",
  };
};
