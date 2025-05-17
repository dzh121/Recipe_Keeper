import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
const serviceAccount = require("../serviceAccountKey.json");

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-" + nanoid(5);

async function run() {
  const userRefs = await db.collection("users").listDocuments();
  console.log("Total user paths:", userRefs.length);

  let batch = db.batch();
  let updated = 0;

  for (const userRef of userRefs) {
    const profileRef = userRef.collection("public").doc("profile");
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) continue;

    const data = profileSnap.data()!;
    if (!data.slug && data.displayName) {
      batch.update(profileRef, { slug: slugify(data.displayName) });
      updated++;

      if (updated % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
  }

  if (updated % 400) await batch.commit();
  console.log(`Added slugs for ${updated} profiles`);
}

run().catch(console.error);
