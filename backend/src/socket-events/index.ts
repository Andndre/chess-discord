import { Server, Socket } from "socket.io";
import { onConnect } from "./on-connect";
import { Events } from "./ws-types";
import { Game } from "./interfaces";

export const games = new Map<string, Game>();
export const connections = new Map<string, string>();

export function broadcastTo(
  wss: (Socket | undefined)[],
  event: Events,
  ...args: any[]
) {
  wss.forEach((ws) => {
    ws?.emit<Events>(event, ...args);
  });
}

export function setupSocketEvents(io: Server) {
  io.on("connection", onConnect);
}
