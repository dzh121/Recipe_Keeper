// server/server.ts
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { authenticateToken } from "./middleware/authMiddleware"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "You are authenticated!", user: req.user })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
