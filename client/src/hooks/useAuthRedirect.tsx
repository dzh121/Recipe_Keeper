"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/start");
      }
    });

    return () => unsubscribe();
  }, [router]);
}
