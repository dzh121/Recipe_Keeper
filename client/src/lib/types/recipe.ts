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
  notes: string;
  review: string;
  tags: string[];
  timeToFinish: number | null;
  rating: number;
  isPublic: boolean;
  createdAt: Timestamp | null;
  recipeType: "link" | "homemade";
  // Homemade recipe fields
  ingredients?: string;
  instructions?: string;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
};