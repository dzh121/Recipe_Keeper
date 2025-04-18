"use client";

import { Box, Flex, Heading, Spacer, IconButton } from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { LuSun, LuMoon } from "react-icons/lu";
import { useHasMounted } from "@/hooks/useHasMounted";
import Logo from "@/components/ui/Logo";
export default function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const hasMounted = useHasMounted();

  return (
    <Box
      as="header"
      py={4}
      px={6}
      borderBottom="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700" }}
    >
      <Flex align="center">
        <Logo />
        <Heading fontSize="lg" fontWeight="semibold">
          RecipeKeeper
        </Heading>
        <Spacer />
        {hasMounted && (
          <IconButton
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Toggle theme"
          >
            {colorMode === "dark" ? <LuSun /> : <LuMoon />}
          </IconButton>
        )}
      </Flex>
    </Box>
  );
}
