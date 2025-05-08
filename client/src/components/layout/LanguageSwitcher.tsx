"use client";

import { Menu, Button, Flex, Text, Box, Portal } from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { LuChevronDown } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { US, IL } from "country-flag-icons/react/3x2";
import { getAuth } from "firebase/auth";

// Flag components
const EnglishFlag = () => <US style={{ width: "24px", marginRight: "8px" }} />;
const HebrewFlag = () => <IL style={{ width: "24px", marginRight: "8px" }} />;

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "he" ? "rtl" : "ltr";

    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/language`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: lng }),
      });
    } catch (err) {
      console.error("Failed to update language preference", err);
    }
  };

  const { flag, name } =
    i18n.language === "he"
      ? { flag: <HebrewFlag />, name: t("language.he") }
      : { flag: <EnglishFlag />, name: t("language.en") };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          variant="outline"
          size="md"
          borderColor={borderColor}
          _hover={{ borderColor: "blue.500" }}
          minW="120px"
        >
          <Flex align="center">
            {flag}
            <Text fontSize="sm">{name}</Text>
            <LuChevronDown />
          </Flex>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            minW="140px"
            zIndex={20}
            shadow="md"
          >
            <Menu.Item
              value="en"
              onSelect={() => changeLanguage("en")}
              bg={i18n.language === "en" ? "blue.50" : undefined}
              _hover={{ bg: "blue.100" }}
              _dark={{
                bg: i18n.language === "en" ? "blue.900" : undefined,
                _hover: { bg: "blue.800" },
              }}
            >
              <Flex align="center">
                <EnglishFlag />
                <Text fontSize="sm">{t("language.en")}</Text>
              </Flex>
            </Menu.Item>
            <Menu.Item
              value="he"
              onSelect={() => changeLanguage("he")}
              bg={i18n.language === "he" ? "blue.50" : undefined}
              _hover={{ bg: "blue.100" }}
              _dark={{
                bg: i18n.language === "he" ? "blue.900" : undefined,
                _hover: { bg: "blue.800" },
              }}
            >
              <Flex align="center">
                <HebrewFlag />
                <Text fontSize="sm">{t("language.he")}</Text>
              </Flex>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
