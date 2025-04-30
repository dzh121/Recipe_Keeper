"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Load your service account key
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(require("../serviceAccountKey.json")),
});
// Set custom claims
async function setAdminRole(uid) {
    firebase_admin_1.default
        .auth()
        .setCustomUserClaims(uid, { role: "admin", admin: true })
        .then(() => {
        console.log(`✅ Admin role granted to user ${uid}`);
    })
        .catch((error) => {
        console.error("❌ Error setting admin role:", error);
    });
}
const userUid = "u9S3hKXJqbO2TXbfCZLZdVUEITP2"; // Replace with the actual UID of the user you want to set as admin
setAdminRole(userUid);
