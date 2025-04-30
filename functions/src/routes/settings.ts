import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { db } from "../firebaseAdmin";

const router = express.Router();

router.post("/color-mode", authenticateToken, async (req, res) => {
  const user = (req as any).user; 
  const { darkMode } = req.body;

  if (!user || !user.uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (typeof darkMode !== "boolean") {
    return res.status(400).json({ error: "Invalid darkMode value" });
  }

  try {
    const settingsRef = db.doc(`users/${user.uid}/private/settings`);
    await settingsRef.set({ darkMode }, { merge: true });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving color mode:", error);
    return res.status(500).json({ error: "Failed to save color mode" });
  }
});

router.get("/color-mode", authenticateToken, async (req, res) => {
  const user = (req as any).user; 
  
  if (!user || !user.uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const settingsRef = db.doc(`users/${user.uid}/private/settings`);
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      return res.status(200).json({ darkMode: null });
    }

    const data = settingsSnap.data();
    return res.status(200).json({ darkMode: !!data?.darkMode });
  } catch (error) {
    console.error("Error fetching color mode:", error);
    return res.status(500).json({ error: "Failed to fetch color mode" });
  }
});

export default router;
