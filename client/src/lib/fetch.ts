import { getToken } from "firebase/app-check";
import { appCheck } from "@/lib/firebase";

export async function fetchWithAuthAndAppCheck(
  url: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    token?: string;
    body?: any;
  }
) {
  let appCheckToken = "";

  try {
    if (appCheck) {
      const result = await getToken(appCheck, false);
      appCheckToken = result.token;
    }
  } catch (err) {
    console.warn("App Check token fetch failed:", err);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  return res;
}
