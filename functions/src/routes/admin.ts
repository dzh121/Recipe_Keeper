import { Router } from "express";
import { db, bucket } from "../firebaseAdmin";
import { authenticateToken } from "../middleware/authMiddleware";
import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

const router = Router();

/* ✅ Middleware to check admin privileges */
const checkOwner = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !user.owner) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

router.delete("/delete-recipe/:id", checkOwner, async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the recipe from Firestore
    await db.collection("recipes").doc(id).delete();

    // Delete associated image from Firebase Storage if needed
    const filePath = `recipes/${id}/photo.jpg`;
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});


export default router;
