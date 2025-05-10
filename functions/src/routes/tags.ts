import express from "express";
import admin from "firebase-admin";
import { authenticateToken } from "../middleware/authMiddleware";
import { Timestamp } from "firebase-admin/firestore";
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

router.post("/suggest", authenticateToken, async (req, res) => {
  const { en, he } = req.body;
  const user = (req as any).user;

  const hasEn = typeof en === "string" && en.trim().length > 0;
  const hasHe = typeof he === "string" && he.trim().length > 0;

  // Must have both
  if (!hasEn || !hasHe) {
    return res.status(400).json({
      error: "Both 'en' and 'he' translations are required.",
    });
  }

  try {
    const id = en.trim().toLowerCase().replace(/\s+/g, "-");

    await admin.firestore().collection("tagSuggestions").add({
      id,
      translations: {
        en: en.trim(),
        he: he.trim(),
      },
      suggestedBy: user.uid,
      createdAt: Timestamp.now(),
      status: "pending",
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Failed to suggest tag:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// GET all tag suggestions (admin only)
router.get("/suggestions", authenticateToken, async (req, res) => {
  const user = (req as any).user;

  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden. Admins only." });
  }

  try {
    const snapshot = await admin.firestore()
      .collection("tagSuggestions")
      .orderBy("createdAt", "desc")
      .get();

    const suggestions = snapshot.docs.map((doc) => ({
      docId: doc.id,    
      ...doc.data(),    
    }));

    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error("Error fetching all tag suggestions:", err);
    return res.status(500).json({ error: "Failed to fetch suggestions." });
  }
});

// GET tag suggestions by current user
router.get("/suggestions/user", authenticateToken, async (req, res) => {
  const user = (req as any).user;

  try {
    const snapshot = await admin.firestore()
      .collection("tagSuggestions")
      .where("suggestedBy", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error("Error fetching user suggestions:", err);
    return res.status(500).json({ error: "Failed to fetch your suggestions." });
  }
});

router.patch("/suggestions/:id/status", authenticateToken, async (req, res) => {
  const user = (req as any).user;

  if (!user || !isAdmin(user)) {
    return res.status(403).json({ error: "Forbidden. Admins only." });
  }

  const suggestionId = req.params.id;
  const { status } = req.body;

  if (!suggestionId || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid ID or status" });
  }

  try {
    const suggestionRef = admin.firestore().collection("tagSuggestions").doc(suggestionId);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    const suggestionData = suggestionDoc.data();
    await suggestionRef.update({ status });

    if (status === "approved") {
      const { id, translations } = suggestionData || {};
      if (!id || !translations) {
        return res.status(400).json({ error: "Missing tag ID or translations in suggestion." });
      }

      const tagsRef = admin.firestore().doc(TAGS_DOC_PATH);
      const tagsDoc = await tagsRef.get();
      const existingTags = tagsDoc.exists ? tagsDoc.data()?.tags || [] : [];

      const tagAlreadyExists = existingTags.some((tag: any) => tag.id === id);
      if (tagAlreadyExists) {
        return res.status(409).json({ error: "Tag already exists in global list." });
      }
      await tagsRef.set(
        {
          tags: admin.firestore.FieldValue.arrayUnion({ id, translations }),
        },
        { merge: true }
      );
      
    }
    return res.status(200).json({ success: true, message: "Status updated." });
  } catch (err) {
    console.error("Failed to update suggestion status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
