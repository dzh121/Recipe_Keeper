import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { config } from "firebase-functions";
import "dotenv/config"; // Loads .env (locally only)
import { getAppCheck } from "firebase-admin/app-check";

let storageBucket: string | undefined;

try {
  // This will work in Firebase Functions only
  const functionsEnv = config().env;
  storageBucket = functionsEnv.storage_bucket;
} catch {
  // fallback for local `.env` file
  storageBucket = process.env.STORAGE_BUCKET;
}

if (!storageBucket) {
  throw new Error("Missing STORAGE_BUCKET in environment variables.");
}

if (!getApps().length) {
  if (process.env.LOCAL_DEV?.toLowerCase() === "true" || process.env.FUNCTIONS_EMULATOR) {
    const serviceAccount = require("../serviceAccountKey.json");
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket,
    });
  } else {
    initializeApp({
      storageBucket,
    });
  }
}

export const adminAuth = getAuth();
export const db = getFirestore();
export const bucket = getStorage().bucket();
export const adminAppCheck = getAppCheck();
