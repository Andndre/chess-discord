export const DISCORD_CDN = "https://cdn.discordapp.com/";

export function getAvatarUrl(userId: string, avatar: string) {
  return `${DISCORD_CDN}avatars/${userId}/${avatar}`;
}
