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
  async function getAppCheckToken(forceRefresh: boolean = false) {
    console.log("Fetching App Check token", forceRefresh);
    try {
      if (appCheck) {
        const result = await getToken(appCheck, forceRefresh);
        console.log("App Check token:", result.token);
        console.log("Expires at:", result);
        return result.token;
        
      }
    } catch (err) {
      console.warn(`App Check token fetch ${forceRefresh ? "refresh" : "initial"} failed:`, err);
    }
    return "";
  }

  const isFormData = options.body instanceof FormData;

  let appCheckToken = await getAppCheckToken(false);
  console.log("App Check token:", appCheckToken);
  const buildHeaders = (token: string): Record<string, string> => ({
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(token ? { "X-Firebase-AppCheck": token } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  });

  const fetchOnce = async (token: string) =>
    await fetch(url, {
      method: options.method || "GET",
      headers: buildHeaders(token),
      body: isFormData ? options.body : JSON.stringify(options.body),
    });

  // First attempt
  let res = await fetchOnce(appCheckToken);

  // Retry if unauthorized and appCheck is available
  if ((res.status === 401 || res.status === 403) && appCheck) {
    const refreshedToken = await getAppCheckToken(true);
    if (refreshedToken) {
      res = await fetchOnce(refreshedToken);
    }
  }

  return res;
}
