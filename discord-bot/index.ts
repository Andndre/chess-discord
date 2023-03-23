import {
  Intents,
  startBot,
} from "https://deno.land/x/discordeno@10.0.0/mod.ts";
import "https://deno.land/std@0.180.0/dotenv/load.ts";

startBot({
  token: Deno.env.get("TOKEN") || "",
  intents: [Intents.GUILDS, Intents.GUILD_MESSAGES],
  eventHandlers: {
    ready() {
      console.log("Successfully connected to gateway");
    },
    messageCreate(message) {
      if (message.content === "!ping") {
        message.reply("Hello, world");
      }
    },
  },
});
