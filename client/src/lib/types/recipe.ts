import { Timestamp } from "firebase/firestore";
export interface Recipe {
  id: string;
  title: string;
  isPublic: boolean;
  tags?: string[];
  recipeType?: "link" | "homemade";
}

export type RecipeFull = {
  id?: string;
  ownerId: string;
  title: string | null;
  link?: string;
  kosher: boolean;
  notes: string;
  review: string;
  tags: string[];
  timeToFinish: number | null;
  rating: number;
  isPublic: boolean;
  createdAt: Timestamp | null;
  recipeType: "link" | "homemade";
  imageURL?: string | null;
  // Homemade recipe fields
  ingredients?: string;
  instructions?: string;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
};