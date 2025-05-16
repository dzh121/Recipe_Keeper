import { Router } from "express";
import { db } from "../firebaseAdmin";
import { authenticateToken } from "../middleware/authMiddleware";
import admin from "firebase-admin";
const router = Router();


router.get("/:id", authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId) return res.status(400).json({ error: "Missing recipeId" });

  const user = (req as any).user; 
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const settingsRef = db.doc(`users/${user.uid}/private/settings`);
  const settingsSnap = await settingsRef.get();

  if (!settingsSnap.exists) {
    return res.status(404).json({ error: "Settings not found" });
  }

  const data = settingsSnap.data();
  const isFavorite = data?.favorites?.includes(recipeId) ?? false;

  return res.status(200).json({ isFavorite });
});

router.post("/:id", authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId) return res.status(400).json({ error: "Missing recipeId" });
  
  const user = (req as any).user; 
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const settingsRef = db.doc(`users/${user.uid}/private/settings`);

  try {
    // Atomically add the recipeId without needing to fetch first
    await settingsRef.update({
      favorites: admin.firestore.FieldValue.arrayUnion(recipeId),
    });

    return res.status(200).json({ message: "Recipe added to favorites" });
  } catch (error: any) {
    console.error("Error adding to favorites:", error);

    // Check if the error is due to the document not existing
    if (error.code === 5 ) {
      await settingsRef.set({
        favorites: [recipeId],
      }, { merge: true });

      return res.status(201).json({ message: "Favorites list created and recipe added" });
    }

    return res.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId) {
    return res.status(400).json({ error: "Missing recipeId" });
  }
  
  const user = (req as any).user; 
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const settingsRef = db.doc(`users/${user.uid}/private/settings`);

  try {
    await settingsRef.update({
      favorites: admin.firestore.FieldValue.arrayRemove(recipeId),
    });

    return res.status(200).json({ message: "Recipe removed from favorites" });
  } catch (error: any) {
    console.error("Error removing from favorites:", error);

    if (error.code === 5) {
      return res.status(404).json({ error: "Settings not found" });
    }

    return res.status(500).json({ error: "Failed to remove favorite" });
  }
});


export default router;
