export type Errors = "game-not-found" | "link-already-clicked";
export type Events =
  | "joinRoom"
  | "error"
  | "start"
  | "watcherJoin"
  | "watcherLeave"
  | "connectToGame"
  | "playerLeave"
  | "connection"
  | "move"
  | "gameOver"
  | "uploadMove"
  | "blackOnline"
  | "whiteOnline";
export type Role = "watching" | "black" | "white";
