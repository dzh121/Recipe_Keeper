// lib/init/fetchInterceptor.ts
import { toaster } from "@/components/ui/toaster";
import i18next from "i18next";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const res = await originalFetch(...args);

    if (res.status === 429) {
      console.warn("Rate limit exceeded. Please wait and try again.");
      toaster.create({
        title: i18next.t("rateLimit.title"),
        description: i18next.t("rateLimit.description"),
        type: "warning",
        duration: 5000,
        meta: { closable: true },
      });
    }

    return res;
  };
}
