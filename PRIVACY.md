# Privacy & Data Access Policy

This document outlines the privacy and data access practices of the **RecipeKeeper** application.

## 🔒 What Data We Collect

RecipeKeeper stores the following types of user data in Firebase:

* **User Profile**: Display name, email, profile picture (if provided)
* **Recipe Content**:

  * Title, notes, ingredients, instructions, etc.
  * Optional photo
  * Type (link or homemade)
  * Rating, review, time to finish, etc.
* **Tags**: Global tags for recipe categorization
* **Favorites**: List of recipe IDs marked as favorites by each user
* **Preferences**:

  * Language
  * Dark/light mode

## 🧑‍💻 Who Can Access What

* **You (the user)**: Can access and manage all your own recipes, tags, settings, and preferences.
* **Other users**: Can only view **public** recipes you have shared.
* **Developer (admin)**:

  * Has access to all recipes (for moderation and maintenance purposes)
  * Does **not** have access to your authentication credentials (passwords or social logins)
  * May view profile metadata for debugging and app improvements

## 🌐 Sharing Recipes

* Recipes marked as **public** are viewable by all users.
* Recipes marked as **private** are only visible to the creator.
* You can also share **external recipe links**, which are saved and optionally made public.

## 🛡️ Security

* All access is protected via Firebase Authentication.
* Only authenticated users can create or modify recipes.
* All write operations require token validation.

## 📄 Data Retention & Deletion

* You can delete any of your recipes or your profile image at any time.
* Deleting your Firebase account will automatically remove your private data from Firestore.

## 📞 Contact

If you have privacy concerns or requests, please reach out via the contact details in the repository or open an issue.

---

This policy may evolve as the app grows. Any significant changes will be documented in the changelog and
