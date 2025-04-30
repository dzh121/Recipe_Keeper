import { useEffect } from "react";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { useHasMounted } from "./useHasMounted";
export function useSyncColorModeOnLogin() {
  const { setTheme } = useTheme();
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!hasMounted) return;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/settings/color-mode`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch color mode");

        const data = await res.json();

        if (typeof data.darkMode === "boolean") {
          setTheme(data.darkMode ? "dark" : "light");
        }
      } catch (err) {
      }
    });

    return () => unsubscribe();
  }, [hasMounted, setTheme]);
}
