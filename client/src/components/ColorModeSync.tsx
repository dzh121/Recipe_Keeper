"use client";

import { useSyncColorModeOnLogin } from "@/hooks/useSyncColorModeOnLogin";

export default function ColorModeSync() {
  useSyncColorModeOnLogin();
  return null;
}
