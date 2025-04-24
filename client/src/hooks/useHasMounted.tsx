// src/hooks/useHasMounted.ts
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme) {
      setHasMounted(true);
    }
  }, [resolvedTheme]);

  return hasMounted;
}
