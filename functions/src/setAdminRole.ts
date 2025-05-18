import admin from "firebase-admin";

// Load your service account key
admin.initializeApp({
  credential: admin.credential.cert(require("../serviceAccountKey.json")),
});

// Set custom claims
async function setAdminRole(uid: string) {
  admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin role granted to user ${uid}`);
  })
  .catch((error) => {
    console.error("❌ Error setting admin role:", error);
  });
}

const userUid = "u9S3hKXJqbO2TXbfCZLZdVUEITP2"; // Replace with the actual UID of the user you want to set as admin

setAdminRole(userUid);
