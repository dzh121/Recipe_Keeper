import type { AppProps } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { AuthProvider } from "@/context/AuthContext";
import ColorModeSync from "@/components/ColorModeSync";
import { useEffect } from "react";
import i18n from "../i18n";
import "@/styles/globals.css";
import LanguageSync from "@/components/LanguageSync";
import "@/lib/init/fetchInterceptor";
import { Toaster } from "@/components/ui/toaster";
import KoFiWidget from "@/components/KoFiWidget";
import Script from "next/script";
import { useRouter } from "next/router";
import { appCheck } from "@/lib/firebase";
import {
  onTokenChanged,
  getToken,
  type AppCheckTokenResult,
} from "firebase/app-check";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Set text direction for Hebrew
  useEffect(() => {
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, []);

  // Track page views on route change (SPA behavior)
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (window.gtag) {
        window.gtag("config", GA_MEASUREMENT_ID, {
          page_path: url,
        });
      }
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    // Assign the imported appCheck to a local constant for TS narrowing
    const localAppCheck = appCheck;

    if (!localAppCheck) return;

    const unsubscribe = onTokenChanged(
      localAppCheck,
      async (token: AppCheckTokenResult | null) => {
        if (!token?.token) {
          try {
            await getToken(localAppCheck, true);
          } catch (err) {
            console.error("App Check token refresh failed:", err);
          }
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>

      <Provider>
        <AuthProvider>
          <Toaster />
          <LanguageSync />
          <ColorModeSync />
          <Component {...pageProps} />
          <KoFiWidget />
        </AuthProvider>
      </Provider>
    </div>
  );
}
