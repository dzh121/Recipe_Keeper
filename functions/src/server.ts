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
import { onRequest } from "firebase-functions/v2/https";
import "dotenv/config";
import { Request } from "express";
import rateLimit from "express-rate-limit";
import { verifyAppCheck } from "./middleware/appCheckMiddleware";
interface AuthedRequest extends Request {
  user?: any;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // Limit each IP to 400 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://recipekeeper-3a217.web.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(limiter);

app.get("/api/protected", authenticateToken, (req: AuthedRequest, res) => {
  res.json({ message: "You are authenticated!", user: req.user });
});

app.use("/recipes", verifyAppCheck, recipeRoutes);

app.use("/favorites", verifyAppCheck, favoritesRoutes);

app.use("/tags", verifyAppCheck, tagsRoute);

app.use("/profile", verifyAppCheck, profileRoutes);

app.use("/settings", verifyAppCheck, settingsRoutes);

app.use("/admin", authenticateToken, verifyAppCheck, adminRoutes);

if (process.env.LOCAL_DEV?.toLowerCase() === "true") {
  console.log("Running in local development mode.");
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
  });
}

export const api = onRequest(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  app
);
