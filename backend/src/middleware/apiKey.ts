import { NextFunction, Request, Response } from "express";

export function apiKey(req: Request, res: Response, next: NextFunction) {
  if (req.headers["api-key"] !== process.env.MY_SECRET) {
    res.status(403).send({ error: "No api-Key provided" });
    return;
  }
  next();
}
