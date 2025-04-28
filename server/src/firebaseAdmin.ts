import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import serviceAccount from "../serviceAccountKey.json";

import dotenv from "dotenv";
dotenv.config();

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!storageBucket) {
  throw new Error("Missing FIREBASE_STORAGE_BUCKET in environment variables.");
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket,
  });
}

export const adminAuth = getAuth();
export const db = getFirestore();
export const bucket = getStorage().bucket();
