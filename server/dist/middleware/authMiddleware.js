"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const firebaseAdmin_1 = require("../firebaseAdmin");
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Missing token" });
    try {
        const decoded = await firebaseAdmin_1.adminAuth.verifyIdToken(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error("Token verification failed:", err);
        res.status(401).json({ message: "Invalid token" });
    }
}
