"use client";

import type { IconButtonProps, SpanProps } from "@chakra-ui/react";
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react";
import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { auth } from "@/lib/firebase";
import { useRef, useEffect } from "react";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";

export interface ColorModeProviderProps extends ThemeProviderProps {
  children?: React.ReactNode;
}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme } = useTheme();
  const currentModeRef = useRef<ColorMode | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveColorModeToServer = async (mode: "light" | "dark") => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/settings/color-mode`,
        {
          method: "POST",
          body: JSON.stringify({ darkMode: mode === "dark" }),
        }
      );
    } catch (error) {
      console.error("Error saving color mode:", (error as Error).message);
    }
  };

  const debouncedSave = (mode: ColorMode) => {
    if (currentModeRef.current === mode) return; // Avoid duplicate save

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      saveColorModeToServer(mode);
      currentModeRef.current = mode;
    }, 400);
  };

  const toggleColorMode = () => {
    const nextMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextMode);
    debouncedSave(nextMode);
  };

  const setColorMode = (mode: ColorMode) => {
    setTheme(mode);
    debouncedSave(mode);
  };

  useEffect(() => {
    // Track initial mode so it doesn't get resent
    if (!currentModeRef.current && resolvedTheme) {
      currentModeRef.current = resolvedTheme as ColorMode;
    }
  }, [resolvedTheme]);

  return {
    colorMode: resolvedTheme as ColorMode,
    toggleColorMode,
    setColorMode,
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? <LuMoon /> : <LuSun />;
}

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {
  "aria-label"?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode();
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle color mode"
        size="sm"
        ref={ref}
        {...props}
        css={{
          _icon: {
            width: "5",
            height: "5",
          },
        }}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  );
});

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function LightMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme light"
        colorPalette="gray"
        colorScheme="light"
        ref={ref}
        {...props}
      />
    );
  }
);

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function DarkMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme dark"
        colorPalette="gray"
        colorScheme="dark"
        ref={ref}
        {...props}
      />
    );
  }
);
