<div align="center">
  <img src="client/public/logo.png" alt="Recipe Keeper Logo" width="120" height="120" />
  
  <h1>Recipe Keeper</h1>
  <p><em>Your personal recipe management solution built with modern web technologies</em></p>

  <a href="https://recipekeeper-3a217.firebaseapp.com" target="_blank">
    <img src="https://img.shields.io/badge/LIVE DEMO-Click to Try-28a745?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo Badge" />
  </a>
  
  <br /><br />

<a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white&style=flat-square" alt="Next.js" /></a>
<a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black&style=flat-square" alt="Firebase" /></a>
<a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white&style=flat-square" alt="Express" /></a>
<a href="https://azure.microsoft.com/en-us/products/cognitive-services/translator/"><img src="https://img.shields.io/badge/Azure_Translator-0078D4?logo=microsoftazure&logoColor=white&style=flat-square" alt="Azure Translator" /></a>

</div>

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <ul>
        <li>🔐 <strong>Secure Authentication</strong> via Firebase Auth</li>
        <li>📝 <strong>Create & Manage Recipes</strong> (Homemade or External Links)</li>
        <li>🏷️ <strong>Custom Tag System</strong> for easy organization</li>
        <li>🌐 <strong>Internationalization</strong> with English & Hebrew support</li>
      </ul>
    </td>
    <td width="50%">
      <ul>
        <li>☁️ <strong>Image Upload</strong> via Firebase Storage</li>
        <li>⭐ <strong>Favorite Recipes</strong> for quick access</li>
        <li>🎨 <strong>Light/Dark Mode</strong> with user preference persistence</li>
        <li>📱 <strong>Responsive Design</strong> for all devices</li>
        <li>🧠 <strong>Smart Tag Translation</strong> using Azure Cognitive Services</li>
        <li>🌍 <strong>Dual-Language Tags</strong> with English & Hebrew fallback</li>
        <li>🚥 <strong>Rate Limit Detection</strong> with global fetch interceptor</li>
      </ul>
    </td>

  </tr>
</table>

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

| Method | Endpoint                | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| GET    | `/recipes?type=public`  | Get all public recipes              |
| GET    | `/recipes?type=private` | Get current user's private recipes  |
| GET    | `/recipes/:id`          | Get single recipe (public or owned) |
| POST   | `/recipes`              | Create new recipe                   |
| PATCH  | `/recipes/:id`          | Update an existing recipe           |
| DELETE | `/recipes/:id`          | Delete a recipe                     |

#### Recipe Media

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| POST   | `/recipes/upload-photo`            | Upload photo to a recipe  |
| GET    | `/recipes/get-photo-url/:recipeId` | Get signed image URL      |
| DELETE | `/recipes/delete-photo/:recipeId`  | Delete image from Storage |

#### Favorites

| Method | Endpoint         | Description                    |
| ------ | ---------------- | ------------------------------ |
| GET    | `/favorites`     | Get user's favorite recipe IDs |
| GET    | `/favorites/:id` | Check if recipe is favorited   |
| POST   | `/favorites/:id` | Add recipe to favorites        |
| DELETE | `/favorites/:id` | Remove recipe from favorites   |

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

| Method | Endpoint         | Description             |
| ------ | ---------------- | ----------------------- |
| GET    | `/tags`          | Get global tag list     |
| POST   | `/tags`          | Add tag (admin only)    |
| DELETE | `/tags/:tagName` | Remove tag (admin only) |

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
