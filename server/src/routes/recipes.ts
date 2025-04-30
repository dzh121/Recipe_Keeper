// server/routes/recipes.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { db, bucket } from "../firebaseAdmin"; 
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import sharp from "sharp";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });


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

router.get("/", async (req, res) => {
  let uid: string | null = null;
  const { type } = req.query;
  const ids = req.query.ids as string | undefined;

  // Try to extract user from token if provided
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      console.warn("Invalid or expired token, treating as guest");
    }
  }

  if (ids) {
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recipeIds = ids.split(",");
    try {
      const recipes = await Promise.all(
        recipeIds.map(async (id) => {
          const docRef = db.collection("recipes").doc(id);
          const snapshot = await docRef.get();
          if (!snapshot.exists) return null;
          const recipe = snapshot.data();
          if (!recipe) return null;

          if (!recipe.isPublic && recipe.ownerId !== uid) return null;

          return { id, ...recipe };
        })
      );

      return res.status(200).json({ recipes: recipes.filter(Boolean) });
    } catch (err) {
      console.error("Error fetching recipes by IDs:", err);
      return res.status(500).json({ error: "Failed to fetch recipes" });
    }
  }

  if (!type) {
    return res.status(400).json({ error: "Missing required query parameter: type" });
  }

  if (type !== "public" && type !== "private") {
    return res.status(400).json({ error: "Invalid query parameter: type must be 'public' or 'private'" });
  }

  if (type === "private" && !uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let query: FirebaseFirestore.Query = db.collection("recipes");

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

router.delete("/:id", authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  const tokenUid = req.user?.uid;

  if (!tokenUid) {
    return res.status(401).json({ error: "Unauthorized" });
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

    await docRef.delete();
    return res.status(200).json({ message: "Recipe deleted" });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// Inside routes/recipes.ts
router.post(
  "/upload-photo",
  upload.single("file"),
  authenticateToken,
  async (req, res) => {
    try {
      const { recipeId } = req.body;
      const file = req.file;

      if (!recipeId || !file) {
        return res.status(400).json({ error: "Missing recipeId or file" });
      }
      if(!req.user || !req.user.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      
      // Retrieve recipe from Firestore
      const recipeDoc = await db.doc(`recipes/${recipeId}`).get();

      if (!recipeDoc.exists) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      const recipeData = recipeDoc.data();
      const uid = req.user.uid;

      if(!recipeData) {
        return res.status(404).json({ error: "Recipe not found" }); 
      }

      if (recipeData.ownerId !== uid) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const fileName = `recipes/${recipeId}/photo.jpg`;
      const fileUpload = bucket.file(fileName);
      const downloadToken = uuidv4();

      const compressedBuffer = await sharp(file.buffer)
      .resize({ width: 800 }) // resize to 800px width (maintains aspect ratio)
      .jpeg({ quality: 75 })  // convert to JPEG with 75% quality
      .toBuffer();
      
      await fileUpload.save(compressedBuffer, {
        metadata: {
          contentType: "image/jpeg",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        fileName
      )}?alt=media&token=${downloadToken}`;

      await db.doc(`recipes/${recipeId}`).update({
        imageURL: publicUrl,
        updatedAt: new Date(),
      });

      res.json({ imageURL: publicUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to upload recipe photo" });
    }
  }
);

router.get("/get-photo-url/:recipeId", async (req, res) => {
  try {
    const { recipeId } = req.params;
    if (!recipeId) return res.status(400).json({ error: "Missing recipeId" });

    let uid: string | null = null;

    // Optional auth handling (like your example)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (err) {
        console.warn("Invalid or expired token. Continuing as guest.");
      }
    }

    const recipeDoc = await db.doc(`recipes/${recipeId}`).get();
    if (!recipeDoc.exists) return res.status(404).json({ error: "Recipe not found" });

    const recipeData = recipeDoc.data();
    if (!recipeData) return res.status(404).json({ error: "Recipe data missing" });

    const isOwner = uid && recipeData.ownerId === uid;
    if (!recipeData.isPublic && !isOwner) {
      return res.status(403).json({ error: "Not authorized to view image" });
    }

    const file = bucket.file(`recipes/${recipeId}/photo.jpg`);
    
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: "Image not found" });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.json({ imageURL: url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get image URL" });
  }
});

router.delete("/delete-photo/:recipeId", authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (!recipeId || typeof recipeId !== "string") {
      return res.status(400).json({ error: "Missing or invalid recipeId" });
    }

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recipeDoc = await db.doc(`recipes/${recipeId}`).get();
    if (!recipeDoc.exists) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipeData = recipeDoc.data();
    const uid = req.user.uid;

    if (!recipeData || recipeData.ownerId !== uid) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const fileName = `recipes/${recipeId}/photo.jpg`;
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }

    // Remove imageURL from Firestore
    await db.doc(`recipes/${recipeId}`).update({
      imageURL: null,
      updatedAt: new Date(),
    });

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ error: "Failed to delete recipe photo" });
  }
});


export default router;
