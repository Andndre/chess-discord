// @deno-types="npm:@types/express"
import express from "npm:express";

import { AppCommandInteraction } from "./utils/types.ts";
import { playWith } from "./slash/playwith.ts";
import { InteractionType, verifyKeyMiddleware } from "npm:discord-interactions";

import "https://deno.land/std@0.180.0/dotenv/load.ts";
import { ping } from "./slash/ping.ts";

const app = express();

app.get("/", (_req, res) => {
  res.status(200);
  res.send({
    message: "Hello world",
  });
});

app.post(
  "/interactions",
  verifyKeyMiddleware(Deno.env.get("CLIENT_PUBLIC_KEY") || ""),
  (req, res) => {
    const interaction = req.body;
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const myInteraction = interaction as AppCommandInteraction;

      switch (myInteraction.data.name) {
        case "ping":
          ping(myInteraction, res);
          break;
        case "playwith": {
          playWith(myInteraction, res);
          break;
        }
      }
    }
  },
);

const PORT = Deno.env.get("PORT") || 8000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
