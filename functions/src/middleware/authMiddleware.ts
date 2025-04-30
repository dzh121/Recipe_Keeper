import { Request, Response, NextFunction } from "express"
import { adminAuth } from "../firebaseAdmin"

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(" ")[1]

  if (!token) return res.status(401).json({ message: "Missing token" })

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    req.user = decoded
    next()
  } catch (err) {
    console.error("Token verification failed:", err)
    res.status(401).json({ message: "Invalid token" })
  }
}
