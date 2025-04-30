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
          `${process.env.NEXT_PUBLIC_API_URL}/api/settings/color-mode`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch color mode");

        const data = await res.json();
        console.log("✅ Synced color mode from server:", data.darkMode);

        if (typeof data.darkMode === "boolean") {
          console.log("🎨 Setting theme to:", data.darkMode ? "dark" : "light");
          setTheme(data.darkMode ? "dark" : "light");
        }
      } catch (err) {
        console.error("❌ Error syncing color mode:", err);
      }
    });

    return () => unsubscribe();
  }, [hasMounted, setTheme]);
}
