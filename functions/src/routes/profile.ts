import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { db, bucket } from "../firebaseAdmin"; 
import { v4 as uuidv4 } from "uuid";
import Busboy from "busboy";

const router = express.Router();


router.post("/upload-photo", authenticateToken, (req, res) => {
  const busboy = Busboy({ headers: req.headers });
  const user = (req as any).user;

  let uid = "";
  let mimeType = "";
  let fileBuffer: Buffer | null = null;

  if (!user || !user.uid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  busboy.on("field", (fieldname, val) => {
    if (fieldname === "uid") {
      uid = val;
    }
  });

  busboy.on("file", (_fieldname, file, info) => {
    mimeType = info.mimeType;
    const chunks: Uint8Array[] = [];
    file.on("data", (data) => chunks.push(data));
    file.on("end", () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on("finish", async () => {
    try {
      if (!uid || !fileBuffer) {
        res.status(400).json({ error: "Missing uid or file" });
        return;
      }

      const fileName = `users/${uid}/profile.jpg`;
      const fileUpload = bucket.file(fileName);
      const downloadToken = uuidv4();

      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: mimeType || "image/jpeg",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileName
      )}?alt=media&token=${downloadToken}`;

      await db.doc(`users/${uid}/public/profile`).set(
        {
          photoURL: publicUrl,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      res.json({ photoURL: publicUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  const isFirebase = !!(req as any).rawBody;

  if (isFirebase) {
    // Firebase Functions
    busboy.end((req as any).rawBody);
  } else {
    // Express
    req.pipe(busboy);
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
