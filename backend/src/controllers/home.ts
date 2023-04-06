import { Request, Response } from "express";
import { publicDir } from "..";
import path from "path";

export default (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
};
