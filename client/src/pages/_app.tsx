import type { AppProps } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from "@/components/ui/provider";
import { AuthProvider } from "@/context/AuthContext";
import ColorModeSync from "@/components/ColorModeSync";
import { useEffect } from "react";
import i18n from "../i18n";
import "@/styles/globals.css";
import LanguageSync from "@/components/LanguageSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.documentElement.dir = i18n.language === "he" ? "rtl" : "ltr";
  }, []);
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Provider>
        <AuthProvider>
          <LanguageSync />
          <ColorModeSync />
          <Component {...pageProps} />
        </AuthProvider>
      </Provider>
    </div>
  );
}
