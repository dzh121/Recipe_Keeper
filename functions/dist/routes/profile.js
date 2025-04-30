"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const firebaseAdmin_1 = require("../firebaseAdmin");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/upload-photo", upload.single("file"), authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { uid } = req.body;
        const file = req.file;
        if (!uid || !file) {
            return res.status(400).json({ error: "Missing uid or file" });
        }
        const fileName = `users/${uid}/profile.jpg`;
        const fileUpload = firebaseAdmin_1.bucket.file(fileName);
        const downloadToken = (0, uuid_1.v4)();
        await fileUpload.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken,
                },
            },
        });
        if (!downloadToken) {
            return res.status(500).json({ error: "Failed to get download token" });
        }
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseAdmin_1.bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;
        await firebaseAdmin_1.db.doc(`users/${uid}/public/profile`).set({
            photoURL: publicUrl,
            updatedAt: new Date(),
        }, { merge: true });
        res.json({ photoURL: publicUrl });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upload photo" });
    }
});
router.delete("/remove-photo", authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const uid = req.query.uid;
        if (!uid) {
            return res.status(400).json({ error: "Missing uid" });
        }
        const fileName = `users/${uid}/profile.jpg`;
        const fileUpload = firebaseAdmin_1.bucket.file(fileName);
        await fileUpload.delete().catch(() => {
            console.log("No existing file found to delete");
        });
        await firebaseAdmin_1.db.doc(`users/${uid}/public/profile`).set({
            photoURL: null,
            updatedAt: new Date(),
        }, { merge: true });
        res.json({ message: "Photo removed" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to remove photo" });
    }
});
exports.default = router;
