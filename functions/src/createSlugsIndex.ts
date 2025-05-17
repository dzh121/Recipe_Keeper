import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const serviceAccount = require("../serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function createSlugsIndex() {
  const userDocs = await db.collection("users").listDocuments();
  let created = 0;

  for (const userRef of userDocs) {
    const uid = userRef.id;
    const profileRef = userRef.collection("public").doc("profile");
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) continue;

    const data = profileSnap.data();
    if (!data?.slug) continue;

    const slugRef = db.doc(`slugs/${data.slug}`);
    const slugSnap = await slugRef.get();

    if (!slugSnap.exists) {
      await slugRef.set({ uid });
      created++;
    }
  }

  console.log(`✅ Created ${created} new slug mappings.`);
}

createSlugsIndex().catch(console.error);
