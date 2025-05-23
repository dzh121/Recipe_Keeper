import { Request, Response, NextFunction } from "express";
import { adminAppCheck } from "../firebaseAdmin"; 

export const verifyAppCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appCheckToken = req.header("X-Firebase-AppCheck");

  if (!appCheckToken) {
    return res.status(401).json({ error: "No App Check token found" });
  }

  try {
    await adminAppCheck.verifyToken(appCheckToken);
    next();
  } catch (err) {
    console.error("App Check verification failed:", err);
    return res.status(401).json({ error: "Invalid App Check token" });
  }
};
