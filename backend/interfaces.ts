import { Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";

export interface Player {
  id: string;
  ws?: Socket;
}

export interface Move {
  from: number;
  to: number;
  // for promoting
  becameTo?: number;
}

export interface Game {
  white: Player;
  black: Player;
  watchKey: string;
  watchers: Socket[];
  moves: Move[];
}
