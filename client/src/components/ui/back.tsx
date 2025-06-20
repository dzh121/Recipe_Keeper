import React from "react";
import { Button } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "next/router";
import { useColorModeValue } from "@/components/ui/color-mode";
import { useTranslation } from "react-i18next";
import { useHasMounted } from "@/hooks/useHasMounted";

const BackButton: React.FC = () => {
  const router = useRouter();
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const { t, i18n } = useTranslation();
  const hasMounted = useHasMounted();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Button
      variant="outline"
      mb={8}
      onClick={handleGoBack}
      size="md"
      borderRadius="full"
      _hover={{ bg: hasMounted ? hoverBg : "gray.50" }}
    >
      {hasMounted ? (
        i18n.language === "he" ? (
          <LuChevronRight />
        ) : (
          <LuChevronLeft />
        )
      ) : undefined}
      {hasMounted ? t("common.back") : "Back"}
    </Button>
  );
};

export default BackButton;
