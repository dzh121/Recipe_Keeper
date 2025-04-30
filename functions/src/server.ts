// server/server.ts
import express from "express"
import cors from "cors"
import { authenticateToken } from "./middleware/authMiddleware"
import recipeRoutes from "./routes/recipes";
import favoritesRoutes from "./routes/favorites";
import tagsRoute from "./routes/tags";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";
import * as functions from "firebase-functions";

const app = express()

app.use(cors())
app.use(express.json())

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "You are authenticated!", user: req.user })
})

app.use("/recipes", recipeRoutes);

app.use("/favorites", favoritesRoutes);

app.use("/tags", tagsRoute);

app.use("/profile", profileRoutes); 

app.use("/settings", settingsRoutes);

export const api = functions.https.onRequest(app);

