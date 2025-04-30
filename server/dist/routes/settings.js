"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const firebaseAdmin_1 = require("../firebaseAdmin");
const router = express_1.default.Router();
router.post("/color-mode", authMiddleware_1.authenticateToken, async (req, res) => {
    const user = req.user;
    const { darkMode } = req.body;
    if (!user || !user.uid) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (typeof darkMode !== "boolean") {
        return res.status(400).json({ error: "Invalid darkMode value" });
    }
    try {
        const settingsRef = firebaseAdmin_1.db.doc(`users/${user.uid}/private/settings`);
        await settingsRef.set({ darkMode }, { merge: true });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error("Error saving color mode:", error);
        return res.status(500).json({ error: "Failed to save color mode" });
    }
});
router.get("/color-mode", authMiddleware_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user || !user.uid) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const settingsRef = firebaseAdmin_1.db.doc(`users/${user.uid}/private/settings`);
        const settingsSnap = await settingsRef.get();
        if (!settingsSnap.exists) {
            return res.status(200).json({ darkMode: null });
        }
        const data = settingsSnap.data();
        return res.status(200).json({ darkMode: !!data?.darkMode });
    }
    catch (error) {
        console.error("Error fetching color mode:", error);
        return res.status(500).json({ error: "Failed to fetch color mode" });
    }
});
exports.default = router;
