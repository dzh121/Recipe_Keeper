// server/types/express/index.d.ts
import "express"

declare module "express-serve-static-core" {
  interface Request {
    user?: import("firebase-admin/auth").DecodedIdToken
  }
}
