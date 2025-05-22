<div align="center">
  <img src="client/public/logo.png" alt="Recipe Keeper Logo" width="120" height="120" />
  
  <h1>Recipe Keeper</h1>
  <p><em>Your personal recipe management solution built with modern web technologies</em></p>

<p align="center">
  <a href="http://recipekeeper-3a217.web.app/" target="_blank">
    <img src="https://img.shields.io/badge/🚀 LIVE DEMO-Click to Try-28a745?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo" />
  </a>
</p>

<br /><br />

  <!-- Frontend -->
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white&style=flat-square" alt="Next.js" />
  </a>
  <a href="https://chakra-ui.com/">
    <img src="https://img.shields.io/badge/Chakra_UI-319795?logo=chakraui&logoColor=white&style=flat-square" alt="Chakra UI" />
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  </a>

  <!-- Backend -->
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white&style=flat-square" alt="Express" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white&style=flat-square" alt="Node.js" />
  </a>
  <a href="https://firebase.google.com/">
    <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black&style=flat-square" alt="Firebase" />
  </a>

  <!-- APIs & Services -->
  <a href="https://azure.microsoft.com/en-us/products/cognitive-services/translator/">
    <img src="https://img.shields.io/badge/Azure_Translator-0078D4?logo=microsoftazure&logoColor=white&style=flat-square" alt="Azure Translator" />
  </a>
  <a href="https://www.google.com/recaptcha/about/">
    <img src="https://img.shields.io/badge/reCAPTCHA_v3-4285F4?logo=google&logoColor=white&style=flat-square" alt="Google reCAPTCHA" />
  </a>

</div>

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <ul>
        <li>🔐 <strong>Secure Authentication</strong> via Firebase Auth with <strong>reCAPTCHA v3 App Check</strong></li>
        <li>📝 <strong>Create & Manage Recipes</strong> (Homemade or External Links)</li>
        <li>🏷️ <strong>Custom Tag System</strong> for easy organization</li>
        <li>🌐 <strong>Internationalization</strong> with English & Hebrew support</li>
        <li>📱 <strong>Responsive Design</strong> for all devices</li>
        <li>🚥 <strong>Rate Limit Detection</strong> with global fetch interceptor</li>
      </ul>
    </td>
    <td width="50%">
      <ul>
        <li>☁️ <strong>Image Upload</strong> via Firebase Storage</li>
        <li>⭐ <strong>Favorite Recipes</strong> for quick access</li>
        <li>🎨 <strong>Light/Dark Mode</strong> with user preference persistence</li>
        <li>🧠 <strong>Smart Tag Translation</strong> using Azure Cognitive Services</li>
        <li>🌍 <strong>Dual-Language Tags</strong> with English & Hebrew fallback</li>
        <li>💡 <strong>Suggest Tags</strong> with admin approval workflow</li>
        <li>🛡️ <strong>App Integrity</strong> protection with Firebase App Check (reCAPTCHA v3)</li>
      </ul>
    </td>
  </tr>
</table>

> You can even suggest new tags for recipes, which admins can review and approve!

## 🏗️ Architecture

Recipe Keeper is a full-stack monorepo built with Next.js, Firebase, and Express:

```
recipe_keeper/
├── client/              # Frontend (Next.js + Chakra UI)
│   └── out/             # Static export for Firebase Hosting
├── functions/           # Backend (Express + Firebase Admin)
│   └──serviceAccountKey.json  # Private Firebase Admin key
├── firebase/            # Firebase configuration
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── storage.rules
├── .firebaserc
├── firebase.json
├── PRIVACY.md
├── README.md
├── LICENSE
└── package.json         # Root scripts and shared configs
```

## 🚀 Getting Started

### Local Development

```bash
# Install dependencies
npm install              # Root level dependencies
cd functions && npm install
cd ../client && npm install

# Start development servers
npm run dev              # Runs frontend and backend concurrently
```

### Build & Deploy

```bash
npm run build            # Build both client and server
npm run deploy           # Deploy to Firebase (hosting + functions)
```

## 💻 Tech Stack

<table>
  <tr>
    <th>Frontend</th>
    <th>Backend</th>
    <th>Infrastructure</th>
  </tr>
  <tr>
    <td>
      <ul>
        <li>Next.js</li>
        <li>TypeScript</li>
        <li>Chakra UI v3</li>
        <li>Tailwind CSS</li>
        <li>i18next</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>Express.js</li>
        <li>Firebase Admin SDK</li>
        <li>Node.js</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>Firebase Authentication</li>
        <li>Firebase Firestore</li>
        <li>Firebase Storage</li>
        <li>Firebase Hosting</li>
        <li>Firebase Functions</li>
        <li>Azure Cognitive Services (Translator API)</li>
      </ul>
    </td>
  </tr>
</table>

## 📡 API Endpoints

### 🔒 Authentication Required for most of Endpoints

#### Recipe Management

| Method | Endpoint             | Description                                                             |
| ------ | -------------------- | ----------------------------------------------------------------------- |
| GET    | `/recipes`           | Get paginated list of recipes (public or private based on `type` param) |
| GET    | `/recipes/:id`       | Get single recipe by ID (if public or owned by user)                    |
| POST   | `/recipes`           | Create a new recipe (requires authentication)                           |
| PATCH  | `/recipes/:id`       | Update a recipe (requires authentication and ownership)                 |
| DELETE | `/recipes/:id`       | Delete a recipe (requires authentication and ownership)                 |
| GET    | `/recipes/user/:uid` | Get all public recipes from a specific user                             |

#### `/recipes` Query Parameters

| Parameter    | Type                          | Description                                                             |
| ------------ | ----------------------------- | ----------------------------------------------------------------------- |
| `type`       | `public` \| `private`         | **Required**. Determines recipe visibility scope (public or user-only)  |
| `favorites`  | `true`                        | Optional. If set, filters results to only the user's favorite recipes   |
| `page`       | number                        | Optional. Page number for pagination (default: `1`)                     |
| `pageSize`   | number                        | Optional. Number of results per page (default: `10`)                    |
| `recipeType` | `link` \| `homemade` \| `all` | Optional. Filter by type of recipe                                      |
| `kosher`     | `true`                        | Optional. Only return kosher recipes                                    |
| `tags`       | comma-separated list          | Optional. Filter recipes that include **all** listed tag IDs            |
| `visibility` | `public` \| `private`         | Optional. Only for `type=private`, filters user's recipes by visibility |
| `search`     | string                        | Optional. Full-text search in `title`                                   |

#### Recipe Media

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| POST   | `/recipes/upload-photo`            | Upload photo to a recipe  |
| GET    | `/recipes/get-photo-url/:recipeId` | Get signed image URL      |
| DELETE | `/recipes/delete-photo/:recipeId`  | Delete image from Storage |

#### Favorites

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/favorites/:id` | Check if recipe is favorited |
| POST   | `/favorites/:id` | Add recipe to favorites      |
| DELETE | `/favorites/:id` | Remove recipe from favorites |

#### User Profile & Settings

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/profile/upload-photo` | Upload profile photo      |
| DELETE | `/profile/remove-photo` | Remove profile photo      |
| GET    | `/settings/color-mode`  | Get stored color mode     |
| POST   | `/settings/color-mode`  | Save preferred color mode |
| GET    | `/settings/language`    | Get user language setting |
| POST   | `/settings/language`    | Save language preference  |

#### Tags

| Method | Endpoint                          | Description                           |
| ------ | --------------------------------- | ------------------------------------- |
| GET    | `/tags`                           | Get global tag list                   |
| POST   | `/tags`                           | Add tag (admin only)                  |
| DELETE | `/tags/:tagName`                  | Remove tag (admin only)               |
| POST   | `/tags/suggest`                   | Suggest a new tag (authenticated)     |
| GET    | `/tags/suggestions`               | Get all tag suggestions (admin only)  |
| GET    | `/tags/suggestions/user`          | Get current user's tag suggestions    |
| PATCH  | `/tags/suggestions/:docId/status` | Update suggestion status (admin only) |

## 📱 App Pages

| Page Name                  | Description                                                           | Access              | Key UI Features                                             |
| -------------------------- | --------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| **Home**                   | Displays public recipes with filtering and sorting options.           | Public              | Search bar, tag filters, recipe type filters, pagination    |
| **My Recipes**             | Dashboard for managing user’s own recipes (add, edit, delete).        | Authenticated Users | Recipe list, visibility toggle, add new recipe button       |
| **Favorites**              | Quick access to recipes the user has marked as favorite.              | Authenticated Users | Heart icons, favorite-only filtering, recipe quick view     |
| **Recipe View**            | Full detail view of a specific recipe.                                | Public or Private   | Title, description, ingredients, instructions, rating, tags |
| **Recipe Editor**          | Used to create or edit a recipe (homemade or link).                   | Authenticated Users | Form with image upload, ingredients, steps, rating, tags    |
| **Tag Management**         | Admin panel for managing global tags and their translations.          | Admin Only          | Tag list, add/delete tag, multi-language support            |
| **User Profile**           | View a specific user's public profile and their shared recipes.       | Public              | Avatar, display name, bio, public recipe list               |
| **Settings**               | Manage personal preferences and app behavior (language, theme, etc.). | Authenticated Users | Avatar upload, bio edit, email/password update, switches    |
| **Suggest Tag**            | Allows users to suggest new tags with translation support.            | Authenticated Users | Suggestion form, input validation, dual-language fields     |
| **Tag Suggestions Review** | Admin view for reviewing and approving user tag suggestions.          | Admin Only          | Status filters, approve/reject actions, metadata view       |
| **404 Page**               | Shown when navigating to a route that doesn't exist.                  | Public              | Custom error message, return to home link                   |

## 📦 Firestore Collections

```
users/{uid}/public/profile
users/{uid}/private/settings
recipes/{recipeId}
global/tags
```

## 🔒 Privacy & Data Policy

RecipeKeeper stores only the data required to provide its core features. Recipes can be marked as **public** or **private**. Only public recipes are viewable by other users.

When sharing **external recipe links**, RecipeKeeper stores the link but **does not host or claim ownership of third-party content**. If you are the owner of linked content and want it removed, please contact us.

All data is stored securely via Firebase and protected by Firebase Authentication.  
View the full [Privacy Policy](./PRIVACY.md).

---

<div align="center">
  <p>Licensed under the <a href="./LICENSE">MIT License</a></p>
  <p>© Recipe Keeper Project Contributors</p>
</div>
