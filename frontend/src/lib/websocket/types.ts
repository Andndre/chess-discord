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
  | "move";

export interface BasicMove {
  from: number;
  to: number;
  // for promoting
  becameTo?: number;
}
