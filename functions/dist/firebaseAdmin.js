"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket = exports.db = exports.adminAuth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const serviceAccountKey_json_1 = __importDefault(require("../serviceAccountKey.json"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
    throw new Error("Missing FIREBASE_STORAGE_BUCKET in environment variables.");
}
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(serviceAccountKey_json_1.default),
        storageBucket,
    });
}
exports.adminAuth = (0, auth_1.getAuth)();
exports.db = (0, firestore_1.getFirestore)();
exports.bucket = (0, storage_1.getStorage)().bucket();
