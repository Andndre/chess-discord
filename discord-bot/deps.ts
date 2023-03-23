// @deno-types="npm:@types/express"
import express from "npm:express@^4.18.2";
import "https://deno.land/std@0.180.0/dotenv/load.ts";

export const app = express();

export * as DI from "npm:discord-interactions@^3.3.0";
export * as utils from "./utils/index.ts";
export * as slash from "./slash/index.ts";
