import { Timestamp } from "firebase/firestore";

export type UserSettings = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  recipesPublished?: number;
  bio?: string;
  isPublic?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
