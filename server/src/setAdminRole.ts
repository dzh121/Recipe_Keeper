import admin from "firebase-admin";

// Load your service account key
admin.initializeApp({
  credential: admin.credential.cert(require("../serviceAccountKey.json")),
});

// Set custom claims
async function setAdminRole(uid: string) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: "admin" });
    console.log(`Custom claim 'admin' added to user ${uid}`);
  } catch (err) {
    console.error("Error setting admin role:", err);
  }
}

const userUid = "USER_UID_HERE"; // Replace with the actual UID of the user you want to set as admin

setAdminRole(userUid);
