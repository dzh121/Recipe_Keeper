// server/server.ts
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { authenticateToken } from "./middleware/authMiddleware"
import recipeRoutes from "./routes/recipes";
import favoritesRoutes from "./routes/favorites";
import tagsRoute from "./routes/tags";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "You are authenticated!", user: req.user })
})

app.use("/api/recipes", recipeRoutes);

app.use("/api/favorites", favoritesRoutes);

app.use("/api/tags", tagsRoute);

app.use("/api/profile", profileRoutes); 

app.use("/api/settings", settingsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
