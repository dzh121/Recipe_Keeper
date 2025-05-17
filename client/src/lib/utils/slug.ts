import { nanoid } from 'nanoid';

export function createSlug(displayName: string): string {
  const baseSlug = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace spaces and symbols with "-"
    .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes

  const suffix = nanoid(5); // 5-char random string

  return `${baseSlug}-${suffix}`;
}
