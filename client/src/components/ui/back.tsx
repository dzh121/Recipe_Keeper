import React from "react";
import { Button, Container } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "next/router";
import { useColorModeValue } from "@/components/ui/color-mode";
import { useTranslation } from "react-i18next";

const BackButton: React.FC = () => {
  const router = useRouter();
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const { t, i18n } = useTranslation();
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
      _hover={{ bg: hoverBg }}
    >
      {i18n.language === "he" ? <LuChevronRight /> : <LuChevronLeft />}
      {t("common.back")}
    </Button>
  );
};

export default BackButton;
