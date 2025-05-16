// server/routes/recipes.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { db, bucket } from "../firebaseAdmin"; 
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import Busboy from "busboy";
import { Request, Response } from "express";
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
    kosher,
  } = req.body;
  const user = (req as any).user;

  const tokenUid = user?.uid;
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
      kosher: Boolean(kosher), 
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
  const {
    type,
    pageSize = "10",
    page = "1",
    tags,
    recipeType,
    kosher,
    search,
  } = req.query;

  const onlyFavorites = req.query.favorites === "true";

  const limit = Math.max(1, parseInt(pageSize as string));
  const currentPage = Math.max(1, parseInt(page as string));
  const neededToSkip = (currentPage - 1) * limit;
  const tagList = (tags as string | undefined)?.split(",").filter(Boolean) ?? [];

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      uid = (await admin.auth().verifyIdToken(auth.split(" ")[1])).uid;
    } catch {
      /* guest – ignore */
    }
  }

  try {
    let favoriteIds: string[] = [];
    if (onlyFavorites) {
      if (!uid) return res.status(401).json({ error: "Unauthorized" });
      const settingsSnap = await db.doc(`users/${uid}/private/settings`).get();
      favoriteIds = settingsSnap.data()?.favorites || [];
      if (favoriteIds.length === 0) {
        return res.json({ recipes: [], totalCount: 0 });
      }
    }

    let query: admin.firestore.Query = db.collection("recipes").orderBy("createdAt", "desc");

    if (type === "public") {
      query = query.where("isPublic", "==", true);
    } else if (type === "private") {
      if (!uid) return res.status(401).json({ error: "Unauthorized" });
      query = query.where("ownerId", "==", uid);

      const visibility = req.query.visibility as string | undefined;
      if (visibility === "public") query = query.where("isPublic", "==", true);
      else if (visibility === "private") query = query.where("isPublic", "==", false);
    }

    if (recipeType && recipeType !== "all") {
      query = query.where("recipeType", "==", recipeType);
    }

    if (kosher === "true") {
      query = query.where("kosher", "==", true);
    }

    if (tagList.length > 0) {
      query = query.where("tags", "array-contains", tagList[0]); // rest handled manually
    }

    const rawSearch = (search as string | undefined) ?? "";
    const searchTerm = rawSearch.trim().toLowerCase() || null;

    const BATCH = 50;
    const matches: any[] = [];
    let lastDoc: admin.firestore.DocumentSnapshot | null = null;
    let skipped = 0;
    let totalMatched = 0;

    let keepFetching = true;
    while (keepFetching) {
      let run = query;
      if (lastDoc) run = run.startAfter(lastDoc);

      const snap = await run.limit(BATCH).get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        lastDoc = doc;
        const data = doc.data();

        // Apply all secondary filters
        if (onlyFavorites && !favoriteIds.includes(doc.id)) continue;
        if (tagList.length > 0 && !tagList.every(t => data.tags?.includes(t))) continue;
        if (searchTerm) {
          const haystack = `${data.title ?? ""} ${data.notes ?? ""}`.toLowerCase();
          if (!haystack.includes(searchTerm)) continue;
        }

        totalMatched++;
        if (skipped < neededToSkip) {
          skipped++;
          continue;
        }

        if (matches.length < limit) {
          matches.push({ id: doc.id, ...data });
        }
      }

      if (snap.size < BATCH) break;
      if (matches.length === limit) break;
    }

    return res.json({ recipes: matches, totalCount: totalMatched });
  } catch (err) {
    console.error("Error fetching paginated recipes:", err);
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
    kosher,
  } = req.body;
  const user = (req as any).user;

  const recipeId = req.params.id;
  const tokenUid = user?.uid;

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
      kosher: Boolean(kosher),
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
  const user = (req as any).user;

  const recipeId = req.params.id;
  const tokenUid = user?.uid;

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

    const file = bucket.file(`recipes/${recipeId}/photo.jpg`);
    await file.delete().catch((err) => {
      if (err.code !== 404){
        console.error("Error deleting file:", err);
        throw err;
      }
    });
    
    return res.status(200).json({ message: "Recipe deleted" });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return res.status(500).json({ error: "Failed to delete recipe" });
  }
});

router.post("/upload-photo", authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;

  let recipeId = "";
  let fileBuffer: Buffer | null = null;

  if (!user || !user.uid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const busboy = Busboy({ headers: req.headers });

  busboy.on("field", (name, val) => {
    if (name === "recipeId") {
      recipeId = val;
    }
  });

  busboy.on("file", (name, file) => {
    const buffers: Uint8Array[] = [];
    file.on("data", (data) => buffers.push(data));
    file.on("end", () => {
      fileBuffer = Buffer.concat(buffers);
    });
  });

  busboy.on("finish", async () => {
    try {
      if (!recipeId || !fileBuffer) {
        res.status(400).json({ error: "Missing recipeId or file" });
        return;
      }

      const recipeRef = db.doc(`recipes/${recipeId}`);
      const recipeDoc = await recipeRef.get();

      if (!recipeDoc.exists) {
        res.status(404).json({ error: "Recipe not found" });
        return;
      }

      const recipeData = recipeDoc.data();
      const uid = user.uid;

      if (!recipeData || recipeData.ownerId !== uid) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      const fileName = `recipes/${recipeId}/photo.jpg`;
      const fileUpload = bucket.file(fileName);
      const downloadToken = uuidv4();

      const compressed = await sharp(fileBuffer)
        .resize({ width: 800 })
        .jpeg({ quality: 75 })
        .toBuffer();

      await fileUpload.save(compressed, {
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

      await recipeRef.update({
        imageURL: publicUrl,
        updatedAt: new Date(),
      });

      res.json({ imageURL: publicUrl });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Failed to upload recipe photo" });
    }
  });

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    res.status(400).json({ error: "Missing rawBody, are you using body parser verify?" });
    return;
  }

  busboy.end(rawBody);
});

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
  const user = (req as any).user;
  try {
    const { recipeId } = req.params;

    if (!recipeId || typeof recipeId !== "string") {
      return res.status(400).json({ error: "Missing or invalid recipeId" });
    }
    
    if (!user || !user.uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recipeDoc = await db.doc(`recipes/${recipeId}`).get();
    if (!recipeDoc.exists) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    const recipeData = recipeDoc.data();
    const uid = user.uid;

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
