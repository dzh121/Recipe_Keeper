"use client";

import { Box, Text, Center, VStack, Link } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import NextLink from "next/link";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

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
        <VStack gap={1}>
          <Text fontSize="sm" opacity={0.7}>
            {t("footer.copyright", { year })}
          </Text>
          <Link
            as={NextLink}
            href="/privacy"
            fontSize="sm"
            color="teal.500"
            _hover={{ textDecoration: "underline" }}
          >
            {t("footer.privacyLink", "Privacy Policy")}
          </Link>
        </VStack>
      </Center>
    </Box>
  );
}
