"use client";

import { Box, Flex, Heading, Spacer, IconButton } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useHasMounted } from "@/hooks/useHasMounted";
import Logo from "@/components/ui/Logo";
export default function Header() {
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
        {hasMounted && <ColorModeButton />}
      </Flex>
    </Box>
  );
}
