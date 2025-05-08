# Recipe Keeper

A full-stack recipe management app built with **Next.js**, **Firebase**, and **Express**. Users can create, tag, and manage personal and public recipes with support for image uploads, favorites, rich filtering, and internationalization.

---

## 🌐 Live Site

> [Live URL Placeholder](https://your-deployment-link.com)

## 🚀 Features

* 🔐 User Authentication (Firebase Auth)
* 📝 Create/Edit/Delete Recipes (Homemade or Link)
* 🏷️ Custom Tag Management
* 🌐 i18n Support (English, Hebrew)
* ☁️ Firebase Storage Image Upload
* ⭐ Favorite Recipes
* 🎨 Light/Dark Mode Persistence

---

## 📁 Monorepo Structure

```
root/
├── client/          # Frontend (Next.js + Chakra UI)
├── functions/       # Backend API (Express + Firebase Admin)
├── firebase.json    # Firebase Hosting & Functions config
└── package.json     # Shared scripts & build commands
```

---

## 🔧 Getting Started Locally

```bash
# Install root-level dependencies (concurrently, Firebase CLI helpers)
npm install

# Initialize backend & frontend
cd functions && npm install
cd ../client && npm install

# Start dev servers concurrently
npm run dev
```

## 📦 Build & Deploy

```bash
npm run build       # Build both client and server
npm run deploy      # Deploy to Firebase (hosting + functions)
```

---

## 📡 API Endpoints

### ✅ Authenticated Routes (require Firebase JWT)

### `/recipes`

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/recipes?type=public`     | Get all public recipes              |
| GET    | `/recipes?type=private`    | Get current user's private recipes  |
| GET    | `/recipes/:id`             | Get single recipe (public or owned) |
| POST   | `/recipes`                 | Create new recipe                   |
| PATCH  | `/recipes/:id`             | Update an existing recipe           |
| DELETE | `/recipes/:id`             | Delete a recipe                     |

#### Recipe Media

| Method | Endpoint                           | Description                        |
| ------ | ---------------------------------- | ---------------------------------- |
| POST   | `/recipes/upload-photo`            | Upload photo to a recipe           |
| GET    | `/recipes/get-photo-url/:recipeId` | Get signed image URL               |
| DELETE | `/recipes/delete-photo/:recipeId`  | Delete image from Firebase Storage |

---

### `/favorites`

| Method | Endpoint         | Description                           |
| ------ | ---------------- | ------------------------------------- |
| GET    | `/favorites`     | Get user's favorite recipe IDs        |
| GET    | `/favorites/:id` | Check if specific recipe is favorited |
| POST   | `/favorites/:id` | Add a recipe to favorites             |
| DELETE | `/favorites/:id` | Remove a recipe from favorites        |

---

### `/profile`

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/profile/upload-photo` | Upload user profile photo |
| DELETE | `/profile/remove-photo` | Remove user profile photo |

---

### `/tags`

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| GET    | `/tags`          | Get global tag list             |
| POST   | `/tags`          | Add tag (admin only)            |
| DELETE | `/tags/:tagName` | Remove tag by name (admin only) |

---

### `/settings`

| Method | Endpoint               | Description                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/settings/color-mode` | Get stored color mode         |
| POST   | `/settings/color-mode` | Save preferred color mode     |
| GET    | `/settings/language`   | Get user language setting     |
| POST   | `/settings/language`   | Save user language preference |

---

## 🔐 Firebase Collections (Firestore)

```
users/{uid}/public/profile
users/{uid}/private/settings
recipes/{recipeId}
global/tags
```

## 🧩 Tech Stack

* **Frontend**: Next.js, TypeScript, Chakra UI v3, Tailwind
* **Backend**: Express, Firebase Admin SDK
* **Storage**: Firebase Firestore & Storage
* **Auth**: Firebase Authentication
* **i18n**: i18next, `react-i18next`

---

## 📄 License

MIT © Daniel Ziv Harel
