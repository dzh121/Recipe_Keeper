// server/routes/recipes.ts
import { Router } from "express";
import { db } from "../firebaseAdmin";
import { authenticateToken } from "../middleware/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
const router = Router();

router.post("/", authenticateToken, async (req, res) => {
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
    console.log("Recipe owner ID:", recipe.ownerId);
    console.log("User ID from token:", uid);
    if (!recipe.isPublic && recipe.ownerId !== uid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json({ recipe });
  } catch (err) {
    console.error("Error fetching recipe:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  let uid: string | null = null;
  const { type } = req.query;

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

  // Validate query
  if (!type) {
    return res.status(400).json({ error: "Missing required query parameter." });
  }

  if (type !== "public" && type !== "private") {
    return res.status(400).json({ error: "Invalid query parameter." });
  }

  if (type === "private" && !uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const collectionRef = db.collection("recipes");
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collectionRef;


    if (type === "public") {
      query = query.where("isPublic", "==", true);
    } else if (uid) {
      query = query.where("ownerId", "==", uid);
    }

    const snapshot = await query.get();
    const recipes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ recipes });
  } catch (err) {
    console.error("Error fetching recipes:", err);
    return res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.patch("/:id", authenticateToken, async (req, res) => {
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

  const recipeId = req.params.id;
  const tokenUid = req.user?.uid;

  if (!tokenUid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!title || !tags || !Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ error: "Missing required recipe fields." });
  }

  try {
    const docRef = db.collection("recipes").doc(recipeId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    const existingData = snapshot.data();
    if (!existingData) {
      return res.status(404).json({ error: "Recipe not found." });
    }
    if (existingData.ownerId !== tokenUid) {
      return res.status(403).json({ error: "Permission denied." });
    }

    const updatedData: any = {
      title: title || null,
      notes: notes || "",
      review: review || "",
      tags,
      timeToFinish: timeToFinish || null,
      rating: rating || 0,
      isPublic: Boolean(isPublic),
      updatedAt: FieldValue.serverTimestamp(),
      recipeType: recipeType || "link",
    };

    if (recipeType === "link") {
      if (!link) return res.status(400).json({ error: "Link is required." });
      updatedData.link = link;
      updatedData.ingredients = FieldValue.delete();
      updatedData.instructions = FieldValue.delete();
      updatedData.servings = FieldValue.delete();
      updatedData.prepTime = FieldValue.delete();
      updatedData.cookTime = FieldValue.delete();
    }

    if (recipeType === "homemade") {
      if (!ingredients || !instructions) {
        return res.status(400).json({
          error: "Homemade recipes require ingredients and instructions.",
        });
      }
      updatedData.ingredients = ingredients;
      updatedData.instructions = instructions;
      updatedData.servings = servings || null;
      updatedData.prepTime = prepTime || null;
      updatedData.cookTime = cookTime || null;
      updatedData.link = FieldValue.delete();
    }

    await docRef.update(updatedData);

    return res.status(200).json({ message: "Recipe updated", id: recipeId });
  } catch (error) {
    console.error("Failed to update recipe:", error);
    return res.status(500).json({ error: "Failed to update recipe" });
  }
});

  
export default router;
