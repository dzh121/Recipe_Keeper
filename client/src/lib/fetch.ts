import { getToken } from "firebase/app-check";
import { appCheck } from "@/lib/firebase";

type FetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchOptions<TBody = unknown> {
  method?: FetchMethod;
  token?: string;
  body?: TBody;
}

export async function fetchWithAuthAndAppCheck<TBody = unknown>(
  url: string,
  options: FetchOptions<TBody>
): Promise<Response> {
  async function getAppCheckToken(forceRefresh: boolean = false): Promise<string> {
    try {
      if (appCheck) {
        const result = await getToken(appCheck, forceRefresh);
        return result.token;
      }
    } catch (err) {
      console.warn(`App Check token fetch ${forceRefresh ? "refresh" : "initial"} failed:`, err);
    }
    return "";
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const appCheckToken = await getAppCheckToken(false);

  const buildHeaders = (token: string): Record<string, string> => ({
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(token ? { "X-Firebase-AppCheck": token } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  });

  const fetchOnce = async (token: string): Promise<Response> =>
    await fetch(url, {
      method: options.method || "GET",
      headers: buildHeaders(token),
      body: isFormData ? (options.body as BodyInit) : JSON.stringify(options.body),
    });

  let res = await fetchOnce(appCheckToken);

  if ((res.status === 401 || res.status === 403) && appCheck) {
    const refreshedToken = await getAppCheckToken(true);
    if (refreshedToken) {
      res = await fetchOnce(refreshedToken);
    }
  }

  return res;
}
