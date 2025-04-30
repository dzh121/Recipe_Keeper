"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebaseAdmin_1 = require("../firebaseAdmin");
const authMiddleware_1 = require("../middleware/authMiddleware");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    const settingsRef = firebaseAdmin_1.db.doc(`users/${user.uid}/private/settings`);
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) {
        return res.status(404).json({ error: "Settings not found" });
    }
    const data = settingsSnap.data();
    const favorites = data?.favorites ?? [];
    return res.status(200).json({ favorites });
});
router.get("/:id", authMiddleware_1.authenticateToken, async (req, res) => {
    const recipeId = req.params.id;
    if (!recipeId)
        return res.status(400).json({ error: "Missing recipeId" });
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    const settingsRef = firebaseAdmin_1.db.doc(`users/${user.uid}/private/settings`);
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) {
        return res.status(404).json({ error: "Settings not found" });
    }
    const data = settingsSnap.data();
    const isFavorite = data?.favorites?.includes(recipeId) ?? false;
    return res.status(200).json({ isFavorite });
});
router.post("/:id", authMiddleware_1.authenticateToken, async (req, res) => {
    const recipeId = req.params.id;
    if (!recipeId)
        return res.status(400).json({ error: "Missing recipeId" });
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    const settingsRef = firebaseAdmin_1.db.doc(`users/${user.uid}/private/settings`);
    try {
        // Atomically add the recipeId without needing to fetch first
        await settingsRef.update({
            favorites: firebase_admin_1.default.firestore.FieldValue.arrayUnion(recipeId),
        });
        return res.status(200).json({ message: "Recipe added to favorites" });
    }
    catch (error) {
        console.error("Error adding to favorites:", error);
        // Check if the error is due to the document not existing
        if (error.code === 5) {
            await settingsRef.set({
                favorites: [recipeId],
            }, { merge: true });
            return res.status(201).json({ message: "Favorites list created and recipe added" });
        }
        return res.status(500).json({ error: "Failed to add favorite" });
    }
});
router.delete("/:id", authMiddleware_1.authenticateToken, async (req, res) => {
    const recipeId = req.params.id;
    if (!recipeId) {
        return res.status(400).json({ error: "Missing recipeId" });
    }
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const settingsRef = firebaseAdmin_1.db.doc(`users/${user.uid}/private/settings`);
    try {
        await settingsRef.update({
            favorites: firebase_admin_1.default.firestore.FieldValue.arrayRemove(recipeId),
        });
        return res.status(200).json({ message: "Recipe removed from favorites" });
    }
    catch (error) {
        console.error("Error removing from favorites:", error);
        if (error.code === 5) {
            return res.status(404).json({ error: "Settings not found" });
        }
        return res.status(500).json({ error: "Failed to remove favorite" });
    }
});
exports.default = router;
