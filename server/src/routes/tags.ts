import express from "express";
import admin from "firebase-admin";
import { authenticateToken } from "../middleware/authMiddleware";
const router = express.Router();

// Helper to check if user is admin
const isAdmin = (user: any) => user?.role === "admin" || user?.admin === true;

const TAGS_DOC_PATH = "global/tags";

router.get("/", async (req, res) => {
  try {
    const tagsDoc = await admin.firestore().doc(TAGS_DOC_PATH).get();

    if (!tagsDoc.exists) {
      return res.status(404).json({ tags: [] });
    }

    const data = tagsDoc.data();
    return res.status(200).json({ tags: data?.tags || [] });
  } catch (err) {
    console.error("Error fetching tags:", err);
    return res.status(500).json({ error: "Failed to fetch tags" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden. Admins only." });
  }

  const { tag } = req.body;
  if (!tag || typeof tag !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'tag' field." });
  }

  try {
    await admin
      .firestore()
      .doc(TAGS_DOC_PATH)
      .update({
        tags: admin.firestore.FieldValue.arrayUnion(tag),
      });

    return res.status(200).json({ message: "Tag added successfully." });
  } catch (err: any) {
    if (err.code === 5) {
      // Document not found
      // If document does not exist, create it
      await admin
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

router.delete("/:tagName", authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden. Admins only." });
  }

  const tagName = req.params.tagName;
  if (!tagName) {
    return res.status(400).json({ error: "Missing tag name in URL." });
  }

  try {
    await admin
      .firestore()
      .doc(TAGS_DOC_PATH)
      .update({
        tags: admin.firestore.FieldValue.arrayRemove(tagName),
      });

    return res.status(200).json({ message: "Tag removed successfully." });
  } catch (err) {
    console.error("Error removing tag:", err);
    return res.status(500).json({ error: "Failed to remove tag." });
  }
});

export default router;
