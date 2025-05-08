"use client";

import { Box, Text, Center } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

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
        <Text fontSize="sm" opacity={0.7}>
          {t("footer.copyright", { year })}
        </Text>
      </Center>
    </Box>
  );
}
