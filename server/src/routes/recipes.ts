// server/routes/recipes.ts
import { Router } from "express";
import { db } from "../firebaseAdmin"; // assumes you have a firebaseAdmin.ts
import { authenticateToken } from "../middleware/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";

const router = Router();

router.post("/", authenticateToken, async (req, res) => {
  const { title, link, notes, review, tags, timeToFinish, rating, isPublic } = req.body;

  if (!req.user?.uid || !link) {
    return res.status(400).json({ error: "Missing uid or link" });
  }
  const tokenUid = req.user?.uid;

  
  if(!tokenUid) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("rating", rating);
  try {
    const recipeData = {
      ownerId: tokenUid,
      title: title || null,
      link,
      notes: notes || "",
      review: review || "",
      tags: Array.isArray(tags) ? tags : [],
      timeToFinish: timeToFinish || null,
      rating: rating,
      isPublic: Boolean(isPublic),
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("recipes").add(recipeData);

    return res.status(201).json({ message: "Recipe saved", id: docRef.id });
  } catch (error) {
    console.error("Failed to save recipe:", error);
    return res.status(500).json({ error: "Failed to save recipe" });
  }
});

export default router;
