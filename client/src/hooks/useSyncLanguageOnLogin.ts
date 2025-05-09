import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useTranslation } from "react-i18next";
import { useHasMounted } from "./useHasMounted";

export function useSyncLanguageOnLogin() {
  const { i18n } = useTranslation();
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!hasMounted) return;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/settings/language`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch language");

        const data = await res.json();
        if (typeof data.language === "string") {
          i18n.changeLanguage(data.language);
          document.documentElement.dir = data.language === "he" ? "rtl" : "ltr";
        }
      } catch (err) {
        console.error("Language sync failed", err);
      }
    });

    return () => unsubscribe();
  }, [hasMounted, i18n]);
}
