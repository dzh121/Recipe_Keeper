"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Helper to check if user is admin
const isAdmin = (user) => user?.role === "admin" || user?.admin === true;
const TAGS_DOC_PATH = "global/tags";
router.get("/", async (req, res) => {
    try {
        const tagsDoc = await firebase_admin_1.default.firestore().doc(TAGS_DOC_PATH).get();
        if (!tagsDoc.exists) {
            return res.status(404).json({ tags: [] });
        }
        const data = tagsDoc.data();
        return res.status(200).json({ tags: data?.tags || [] });
    }
    catch (err) {
        console.error("Error fetching tags:", err);
        return res.status(500).json({ error: "Failed to fetch tags" });
    }
});
router.post("/", authMiddleware_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user || !isAdmin(user)) {
        return res.status(403).json({ error: "Forbidden. Admins only." });
    }
    const { tag } = req.body;
    if (!tag || typeof tag !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'tag' field." });
    }
    try {
        await firebase_admin_1.default
            .firestore()
            .doc(TAGS_DOC_PATH)
            .update({
            tags: firebase_admin_1.default.firestore.FieldValue.arrayUnion(tag),
        });
        return res.status(200).json({ message: "Tag added successfully." });
    }
    catch (err) {
        if (err.code === 5) {
            // Document not found
            // If document does not exist, create it
            await firebase_admin_1.default
                .firestore()
                .doc(TAGS_DOC_PATH)
                .set({
                tags: [tag],
            });
            return res
                .status(201)
                .json({ message: "Tag document created and tag added." });
        }
        console.error("Error adding tag:", err);
        return res.status(500).json({ error: "Failed to add tag." });
    }
});
router.delete("/:tagName", authMiddleware_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user || !isAdmin(user)) {
        return res.status(403).json({ error: "Forbidden. Admins only." });
    }
    const tagName = req.params.tagName;
    if (!tagName) {
        return res.status(400).json({ error: "Missing tag name in URL." });
    }
    try {
        await firebase_admin_1.default
            .firestore()
            .doc(TAGS_DOC_PATH)
            .update({
            tags: firebase_admin_1.default.firestore.FieldValue.arrayRemove(tagName),
        });
        return res.status(200).json({ message: "Tag removed successfully." });
    }
    catch (err) {
        console.error("Error removing tag:", err);
        return res.status(500).json({ error: "Failed to remove tag." });
    }
});
exports.default = router;
