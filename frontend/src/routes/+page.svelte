<script lang="ts">
  import ButtonOutline from "./../lib/components/ButtonOutline.svelte";
  import { goto } from "$app/navigation";
  import { PUBLIC_DISCORD_OAUTH_URL } from "$env/static/public";
  import ButtonSend from "$lib/components/ButtonSend.svelte";
</script>

<svelte:head>
  <title
    >Chassse Discord - Discord Bot to Play Chess with just a few steps</title
  >
  <meta
    name="description"
    content="Do You Play Chess? Well, I have a good news for you. This Discord Bot allows you to play
  Chess with your Discord Friends with just a few steps."
  />
</svelte:head>

<header class="flex px-6 py-4 justify-between items-center">
  <strong class="text-lg">Chassse Discord</strong>
  <ButtonOutline
    onClick={() => {
      goto(PUBLIC_DISCORD_OAUTH_URL);
    }}
    >Login
  </ButtonOutline>
</header>
<div
  class="container mx-auto mt-8 px-6 flex flex-col gap-8 lg:flex-row lg:items-center"
>
  <div class="space-y-3">
    <h1>Do You Play Chess?</h1>
    <p>
      Well, I have good news for you. This Discord Bot allows you to play Chess
      with your Discord Friends with just a few steps.
    </p>
    <div class="py-1" />
    <ButtonSend
      onClick={() => {
        goto("/invite-bot");
      }}>Invite the Bot to your server</ButtonSend
    >
  </div>
  <div>
    <img
      width="672px"
      height="446px"
      class="w-full lg:w-screen lg:max-w-2xl"
      src="/hero.svg"
      alt="hero"
    />
  </div>
</div>
