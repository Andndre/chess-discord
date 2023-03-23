// @deno-types="@types/express"
import express from "express";
import "https://deno.land/std@0.180.0/dotenv/load.ts";

export const app = express();

export * as DI from "discord-interactions";
export * as utils from "./utils/index.ts";
export * as slash from "./slash/index.ts";
