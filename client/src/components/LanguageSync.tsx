"use client";

import { useSyncLanguageOnLogin } from "@/hooks/useSyncLanguageOnLogin";

export default function LanguageSync() {
  useSyncLanguageOnLogin();
  return null;
}
