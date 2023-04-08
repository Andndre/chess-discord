import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketEvents } from "./socket-events";
import { apiKey } from "./middleware/apiKey";

import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import path from "path";

import home from "./controllers/create";
import create from "./controllers/create";
import getGame from "./controllers/getGame";

import "dotenv/config";
import getRole from "./controllers/getRole";

// constants
export const publicDir = path.join(__dirname, "../public");
export const PORT = process.env.PORT || 5000;
export const FRONT_END_URL = process.env.FRONT_END_URL!;

// express application
const app = express();

// cookie parser
app.use(cookieParser());

// for parsing application/json
app.use(express.json());

// cors
app.use(cors({
  origin: FRONT_END_URL,
}));

// express static
app.use(express.static(publicDir));

// express server
const server = createServer(app);

// socket-io
const io = new Server(server, {
  path: "/socket/",
  cors: {
    origin: FRONT_END_URL,
  },
});

// socket-events
setupSocketEvents(io);

// routes
app
  .get("/", home)
  .post("/create", apiKey, create)
  .get("/getGame", apiKey, getGame)
  .post("/getRole", apiKey, getRole);

// serve
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
