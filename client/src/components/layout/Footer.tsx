"use client";

import { Box, Text, Center } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box
      as="footer"
      py={6}
      mt={12}
      borderTop="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700" }}
    >
      <Center>
        <Text fontSize="sm" opacity={0.7}>
          © {new Date().getFullYear()} RecipeKeeper. All rights reserved.
        </Text>
      </Center>
    </Box>
  );
}
