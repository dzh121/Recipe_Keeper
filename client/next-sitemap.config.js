const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("../functions/serviceAccountKey.json");

// Initialize Firebase Admin SDK (only once)
const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://recipekeeper-3a217.web.app",
  generateRobotsTxt: true,
  exportTrailingSlash: true,

  exclude: [
    "/admin/*",
    "/signin",
    "/settings",
    "/tags/manage",
    "/recipes/favorites",
    "/tags/suggest",
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/signin",
          "/settings",
          "/tags/manage",
          "/recipes/favorites",
        ],
      },
    ],
  },

  additionalPaths: async () => {
    const recipeSnapshot = await db
      .collection("recipes")
      .where("isPublic", "==", true)
      .get();
    const userSnapshot = await db.collectionGroup("slugs").get();

    const recipePaths = recipeSnapshot.docs.map((doc) => ({
      loc: `/recipes/${doc.id}`,
      lastmod: new Date().toISOString(),
    }));

    const userPaths = userSnapshot.docs.map((doc) => {
      const slug = doc.data().slug || doc.id;
      return {
        loc: `/user/${slug}`,
        lastmod: new Date().toISOString(),
      };
    });

    return [...recipePaths, ...userPaths];
  },
};
