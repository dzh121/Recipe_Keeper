// server/types/express/index.d.ts
import "express"
import { Request } from "express";
import { File } from "multer";

interface MulterRequest extends Request {
  file: File;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: import("firebase-admin/auth").DecodedIdToken
  }
}
