// server/server.ts
import express from "express";
import cors from "cors";
import { authenticateToken } from "./middleware/authMiddleware";
import recipeRoutes from "./routes/recipes";
import favoritesRoutes from "./routes/favorites";
import tagsRoute from "./routes/tags";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";
import adminRoutes from "./routes/admin";
import * as functions from "firebase-functions";
import "dotenv/config";
import { Request } from "express";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";

interface AuthedRequest extends Request {
  user?: any;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser. text({type: "/"}));
app.use(limiter);

app.get("/api/protected", authenticateToken, (req: AuthedRequest, res) => {
  res.json({ message: "You are authenticated!", user: req.user });
});

app.use("/recipes", recipeRoutes);

app.use("/favorites", favoritesRoutes);

app.use("/tags", tagsRoute);

app.use("/profile", profileRoutes); 

app.use("/settings", settingsRoutes);

app.use("/admin", authenticateToken, adminRoutes);

if (process.env.LOCAL_DEV?.toLowerCase() === "true") {
  console.log("Running in local development mode.");
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
  });
}

export const api = functions.https.onRequest(app);

