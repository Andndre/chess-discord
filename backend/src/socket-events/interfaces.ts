import { Socket } from "socket.io";

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
  watchers: Socket[];
  moves: Move[];
}
