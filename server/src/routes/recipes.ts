// server/routes/recipes.ts
import { Router } from "express";
import { db } from "../firebaseAdmin";
import { authenticateToken } from "../middleware/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
const router = Router();

router.post("/", authenticateToken, async (req, res) => {
  console.log("recipes.ts loaded");

  const {
    title,
    link,
    notes,
    review,
    tags,
    timeToFinish,
    rating,
    isPublic,
    recipeType,
    ingredients,
    instructions,
    servings,
    prepTime,
    cookTime,
  } = req.body;

  const tokenUid = req.user?.uid;
  console.log("Got request to save recipe", req.body);
  if (!tokenUid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!title || !tags || !Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ error: "Missing required recipe fields." });
  }

  try {
    const baseData: any = {
      ownerId: tokenUid,
      title: title || null,
      notes: notes || "",
      review: review || "",
      tags,
      timeToFinish: timeToFinish || null,
      rating: rating || 0,
      isPublic: Boolean(isPublic),
      createdAt: FieldValue.serverTimestamp(),
      recipeType: recipeType || "link",
    };

    if (recipeType === "link") {
      if (!link) return res.status(400).json({ error: "Link is required." });
      baseData.link = link;
    }

    if (recipeType === "homemade") {
      if (!ingredients || !instructions) {
        return res.status(400).json({
          error: "Homemade recipes require ingredients and instructions.",
        });
      }
      baseData.ingredients = ingredients;
      baseData.instructions = instructions;
      baseData.servings = servings || null;
      baseData.prepTime = prepTime || null;
      baseData.cookTime = cookTime || null;
    }

    const docRef = await db.collection("recipes").add(baseData);
    return res.status(201).json({ message: "Recipe saved", id: docRef.id });
  } catch (error) {
    console.error("Failed to save recipe:", error);
    return res.status(500).json({ error: "Failed to save recipe" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  let uid: string | null = null;

  // Try to extract user from token if provided
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      console.warn("Invalid or expired token, treating as guest");
    }
  }

  try {
    const docRef = db.collection("recipes").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipe = snapshot.data();
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Block access to private recipes for guests or unrelated users
    if (!recipe.isPublic && recipe.ownerId !== uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json({ recipe });
  } catch (err) {
    console.error("Error fetching recipe:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;
