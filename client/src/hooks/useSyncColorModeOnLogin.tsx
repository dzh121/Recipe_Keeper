import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { useHasMounted } from "./useHasMounted";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";

export function useSyncColorModeOnLogin() {
  const { setTheme, resolvedTheme } = useTheme();
  const hasMounted = useHasMounted();
  const syncedOnce = useRef(false);

  useEffect(() => {
    if (!hasMounted || syncedOnce.current) return;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || syncedOnce.current) return;

      try {
        const token = await user.getIdToken();
        const res = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/settings/color-mode`,
          {
            method: "GET",
            token,
          }
        );

        if (!res.ok) throw new Error("Failed to fetch color mode");

        const data = await res.json();
        if (typeof data.darkMode === "boolean") {
          const fetchedMode = data.darkMode ? "dark" : "light";
          if (resolvedTheme !== fetchedMode) {
            setTheme(fetchedMode);
          }
          syncedOnce.current = true;
        }
      } catch {}
    });

    return () => unsubscribe();
  }, [hasMounted, setTheme, resolvedTheme]);
}
