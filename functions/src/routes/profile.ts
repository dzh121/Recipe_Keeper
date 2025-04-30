import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/authMiddleware";
import { db, bucket } from "../firebaseAdmin"; 
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-photo", upload.single("file"),authenticateToken, async (req, res) => {
  try {
    const { uid } = req.body;
    const file = req.file;

    if (!uid || !file) {
      return res.status(400).json({ error: "Missing uid or file" });
    }

    const fileName = `users/${uid}/profile.jpg`;
    const fileUpload = bucket.file(fileName);
    const downloadToken = uuidv4(); 

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
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;

    await db.doc(`users/${uid}/public/profile`).set(
      {
        photoURL: publicUrl,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    res.json({ photoURL: publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

router.delete("/remove-photo", authenticateToken, async (req, res) => {
  try {
    const uid = req.query.uid;

    if (!uid) {
      return res.status(400).json({ error: "Missing uid" });
    }

    const fileName = `users/${uid}/profile.jpg`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.delete().catch(() => {
      console.log("No existing file found to delete");
    });

    await db.doc(`users/${uid}/public/profile`).set(
      {
        photoURL: null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    res.json({ message: "Photo removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove photo" });
  }
});


export default router;
