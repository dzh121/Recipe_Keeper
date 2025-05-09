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
  const user = (req as any).user;
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden. Admins only." });
  }

  const { id, translations } = req.body;

  if (
    !id || typeof id !== "string" ||
    !translations || typeof translations !== "object" ||
    typeof translations.en !== "string"
  ) {
    return res.status(400).json({ error: "Missing or invalid tag data." });
  }

  const newTag = { id, translations };

  try {
    const tagsRef = admin.firestore().doc(TAGS_DOC_PATH);
    const tagsDoc = await tagsRef.get();

    if (!tagsDoc.exists) {
      await tagsRef.set({ tags: [newTag] });
      return res.status(201).json({ message: "Tag document created and tag added." });
    }

    const existingTags = tagsDoc.data()?.tags || [];
    const alreadyExists = existingTags.some((tag: any) => tag.id === id);

    if (alreadyExists) {
      return res.status(409).json({ error: "Tag already exists." });
    }

    await tagsRef.update({
      tags: admin.firestore.FieldValue.arrayUnion(newTag),
    });

    return res.status(200).json({ message: "Tag added successfully." });
  } catch (err) {
    console.error("Error adding tag:", err);
    return res.status(500).json({ error: "Failed to add tag." });
  }
});

router.delete("/:tagId", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden. Admins only." });
  }

  const tagId = req.params.tagId;
  if (!tagId) {
    return res.status(400).json({ error: "Missing tag ID in URL." });
  }

  try {
    const tagsRef = admin.firestore().doc(TAGS_DOC_PATH);
    const tagsDoc = await tagsRef.get();

    if (!tagsDoc.exists) {
      return res.status(404).json({ error: "Tags document not found." });
    }

    const existingTags = tagsDoc.data()?.tags || [];
    const updatedTags = existingTags.filter((tag: any) => tag.id !== tagId);

    await tagsRef.update({ tags: updatedTags });

    return res.status(200).json({ message: "Tag removed successfully." });
  } catch (err) {
    console.error("Error removing tag:", err);
    return res.status(500).json({ error: "Failed to remove tag." });
  }
});

export default router;
