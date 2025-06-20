"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Button,
  Heading,
  Text,
  Input,
  VStack,
  HStack,
  Group,
  Flex,
  Spinner,
  IconButton,
  Badge,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { LuPlus, LuTag } from "react-icons/lu";
import { FiX } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useHasMounted } from "@/hooks/useHasMounted";
import { toaster, Toaster } from "@/components/ui/toaster";
import Head from "next/head";
import { auth } from "@/lib/firebase";
import { useTranslation } from "react-i18next";
import BackButton from "@/components/ui/back";
import type { Tag } from "@/lib/types/tag";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";

export default function TagsManagementPage() {
  const hasMounted = useHasMounted();
  const { t, i18n } = useTranslation();

  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagEn, setNewTagEn] = useState("");
  const [newTagHe, setNewTagHe] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Chakra UI color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tagBg = useColorModeValue("teal.100", "teal.700");
  const tagColor = useColorModeValue("teal.800", "teal.100");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const bg = useColorModeValue("gray.50", "gray.900");
  const colorMain = useColorModeValue("gray.800", "white");

  const fetchTags = useCallback(async () => {
    const authToken = await auth.currentUser?.getIdToken();
    try {
      setIsLoading(true);
      const response = await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/tags`,
        { method: "GET", token: authToken }
      );
      if (!response.ok) throw new Error("Failed to fetch tags");
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      toaster.create({
        title: t("tagManagement.toasts.fetchError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("tagManagement.toasts.fetchError.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]); // ✅ Now safe and stable
  const handleAddTag = async () => {
    if (!newTagEn.trim()) {
      toaster.create({
        title: t("tagManagement.toasts.tagNameMissing.title"),
        description: t("tagManagement.toasts.tagNameMissing.description"),
        type: "warning",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    const newId = newTagEn.trim().toLowerCase().replace(/\s+/g, "-");

    if (tags.some((tag) => tag.id === newId)) {
      toaster.create({
        title: t("tagManagement.toasts.tagExists.title"),
        description: t("tagManagement.toasts.tagExists.description", {
          tag: newTagEn,
        }),
        type: "warning",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    const authToken = await auth.currentUser?.getIdToken();

    try {
      setIsAdding(true);

      const response = await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/tags`,
        {
          method: "POST",
          token: authToken,
          body: {
            id: newId,
            translations: {
              en: newTagEn.trim(),
              he: newTagHe.trim(),
            },
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add tag");
      }

      setTags([
        ...tags,
        {
          id: newId,
          translations: {
            en: newTagEn.trim(),
            he: newTagHe.trim(),
          },
        },
      ]);

      toaster.create({
        title: t("tagManagement.toasts.tagAdded.title"),
        description: t("tagManagement.toasts.tagAdded.description", {
          tag: newTagEn,
        }),
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });

      setNewTagEn("");
      setNewTagHe("");
    } catch (error) {
      toaster.create({
        title: t("tagManagement.toasts.addError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("tagManagement.toasts.addError.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const authToken = await auth.currentUser?.getIdToken();

    try {
      const response = await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/tags/${tagId}`,
        {
          method: "DELETE",
          token: authToken,
        }
      );

      if (!response.ok) throw new Error("Failed to delete tag");

      setTags(tags.filter((tag) => tag.id !== tagId));

      toaster.create({
        title: t("tagManagement.toasts.tagDeleted.title"),
        description: t("tagManagement.toasts.tagDeleted.description", {
          tag: tagId,
        }),
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
    } catch (error) {
      toaster.create({
        title: t("tagManagement.toasts.deleteError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("tagManagement.toasts.deleteError.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
    }
  };

  async function translateText(
    text: string,
    from: string,
    to: string
  ): Promise<string> {
    const endpoint =
      "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";

    const response = await fetch(`${endpoint}&from=${from}&to=${to}`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.NEXT_PUBLIC_TRANSLATOR_KEY!,
        "Ocp-Apim-Subscription-Region":
          process.env.NEXT_PUBLIC_TRANSLATOR_REGION!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text }]),
    });

    const result = await response.json();
    return result[0].translations[0].text;
  }

  if (!hasMounted) return null; // Prevents hydration errors

  return (
    <Box
      minH="100vh"
      bg={bg}
      color={colorMain}
      display="flex"
      flexDirection="column"
    >
      <Head>
        <title>Manage Tags | Recipe Keeper</title>
        <meta
          name="description"
          content="Manage your recipe tags to better organize and find your favorite recipes."
        />
        <meta name="robots" content="noindex" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="Manage Tags | RecipeKeeper" />
        <meta
          property="og:description"
          content="Easily organize your recipes with custom tags"
        />
      </Head>

      <Toaster />
      <Header />

      <Container maxW="container.md" py={10} flex="1">
        <BackButton />
        <VStack gap={6} align="stretch" mb={8}>
          <Heading size="xl" fontWeight="bold">
            {t("tagManagement.title")}
          </Heading>
          <Text fontSize="lg" color={textColor}>
            {t("tagManagement.description")}
          </Text>
        </VStack>

        <Box
          borderWidth="1px"
          borderRadius="xl"
          p={6}
          bg={cardBg}
          borderColor={borderColor}
          shadow="md"
          mb={8}
        >
          <VStack align="stretch" gap={4}>
            {/* Hebrew → English */}
            <Box mb={6}>
              <Text mb={2} fontWeight="medium">
                {t("tagManagement.translationSection")}
              </Text>

              <VStack gap={4} align="stretch">
                <Box>
                  <Text mb={1} fontSize="sm" color={textColor}>
                    {t("tagManagement.hebrewLabel")}
                  </Text>
                  <Group>
                    <Input
                      placeholder={t("tagManagement.inputHebrew")}
                      value={newTagHe}
                      onChange={(e) => setNewTagHe(e.target.value)}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                    <Button
                      ml={2}
                      variant="outline"
                      colorPalette="teal"
                      disabled={!newTagHe.trim()}
                      onClick={async () => {
                        const translated = await translateText(
                          newTagHe.trim(),
                          "he",
                          "en"
                        );
                        if (translated) {
                          const capitalized =
                            translated.charAt(0).toUpperCase() +
                            translated.slice(1);
                          setNewTagEn(capitalized);
                        }
                      }}
                    >
                      {t("tagManagement.translateToEnglish")}
                    </Button>
                  </Group>
                </Box>

                {/* English → Hebrew */}
                <Box>
                  <Text mb={1} fontSize="sm" color={textColor}>
                    {t("tagManagement.englishLabel")}
                  </Text>
                  <Group>
                    <Input
                      placeholder={t("tagManagement.inputEnglish")}
                      value={newTagEn}
                      onChange={(e) => setNewTagEn(e.target.value)}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                    <Button
                      ml={2}
                      variant="outline"
                      colorPalette="teal"
                      disabled={!newTagEn.trim()}
                      onClick={async () => {
                        const translated = await translateText(
                          newTagEn.trim(),
                          "en",
                          "he"
                        );
                        if (translated) setNewTagHe(translated);
                      }}
                    >
                      {t("tagManagement.translateToHebrew")}
                    </Button>
                  </Group>
                </Box>
              </VStack>
            </Box>

            {/* Add Tag Button */}
            <Button
              colorPalette="teal"
              size="md"
              onClick={handleAddTag}
              loading={isAdding}
              loadingText={t("tagManagement.adding")}
              borderRadius="md"
              px={6}
              alignSelf="start"
            >
              <LuPlus />
              {t("tagManagement.addButton")}
            </Button>
          </VStack>
        </Box>

        <Box
          borderWidth="1px"
          borderRadius="xl"
          p={6}
          bg={cardBg}
          borderColor={borderColor}
          shadow="md"
        >
          <Stack
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap={4}
            mb={6}
          >
            <Input
              placeholder={t("tagManagement.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              w="100%"
              maxW={{ base: "100%", sm: "300px", md: "500px" }}
              _focus={{ borderColor: "teal.400" }}
            />

            <HStack gap={3}>
              <LuTag size={24} color="teal" />
              <Heading size="md">{t("tagManagement.yourTags")}</Heading>
              <Badge colorPalette="teal" borderRadius="full" px={2}>
                {tags.length}
              </Badge>
            </HStack>
          </Stack>

          {isLoading ? (
            <Flex justify="center" align="center" h="120px">
              <Spinner size="xl" color="teal.500" borderWidth="4px" />
            </Flex>
          ) : tags.length > 0 ? (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
              {tags
                .filter((tag) => {
                  const query = searchQuery.toLowerCase();
                  const lang = i18n.language;
                  const matchText = `${tag.translations[lang] || ""} ${
                    tag.translations.en || ""
                  } ${tag.translations.he || ""}`.toLowerCase();
                  return matchText.includes(query);
                })
                .map((tag) => (
                  <Box
                    key={tag.id}
                    bg={tagBg}
                    color={tagColor}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    minW="0"
                    maxW="100%"
                    _hover={{ boxShadow: "sm", transform: "translateY(-1px)" }}
                  >
                    <Text
                      fontWeight="medium"
                      flex="1"
                      minW="0"
                      lineClamp={2}
                      lineHeight="1.3"
                      truncate={false}
                      fontSize="sm"
                      whiteSpace="normal"
                    >
                      {i18n.language === "he"
                        ? `${tag.translations.he || tag.id} / ${
                            tag.translations.en
                          }`
                        : `${tag.translations.en} / ${
                            tag.translations.he || tag.id
                          }`}
                    </Text>
                    <IconButton
                      aria-label={`Remove ${tag.id} tag`}
                      size="xs"
                      variant="ghost"
                      colorPalette="teal"
                      ml={2}
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      <FiX />
                    </IconButton>
                  </Box>
                ))}
            </SimpleGrid>
          ) : (
            <Box
              textAlign="center"
              py={10}
              borderWidth="1px"
              borderStyle="dashed"
              borderColor={borderColor}
              borderRadius="lg"
            >
              <LuTag
                size={36}
                style={{ margin: "0 auto 16px" }}
                opacity={0.5}
              />
              <Text color="gray.500" fontSize="lg">
                {t("tagManagement.noTagsFound")}
              </Text>
            </Box>
          )}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
