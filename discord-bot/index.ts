import { app, DI, slash, utils } from "./deps.ts";

app.get("/", (_req, res) => {
  res.status(200);
  res.send({
    message: "Hello world",
  });
});

app.post(
  "/interactions",
  DI.verifyKeyMiddleware(Deno.env.get("CLIENT_PUBLIC_KEY") || ""),
  (req, res) => {
    const interaction = req.body;
    if (interaction.type === DI.InteractionType.APPLICATION_COMMAND) {
      const myInteraction = interaction as utils.AppCommandInteraction;

      switch (myInteraction.data.name) {
        case "ping":
          slash.ping(myInteraction, res);
          break;
        case "playwith": {
          slash.playWith(myInteraction, res);
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
