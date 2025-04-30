"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const recipes_1 = __importDefault(require("./routes/recipes"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const tags_1 = __importDefault(require("./routes/tags"));
const profile_1 = __importDefault(require("./routes/profile"));
const settings_1 = __importDefault(require("./routes/settings"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/protected", authMiddleware_1.authenticateToken, (req, res) => {
    res.json({ message: "You are authenticated!", user: req.user });
});
app.use("/api/recipes", recipes_1.default);
app.use("/api/favorites", favorites_1.default);
app.use("/api/tags", tags_1.default);
app.use("/api/profile", profile_1.default);
app.use("/api/settings", settings_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
