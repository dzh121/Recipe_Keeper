"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Button,
  Heading,
  Text,
  Input,
  VStack,
  HStack,
  Stack,
  Flex,
  Spinner,
  IconButton,
  Badge,
  SimpleGrid,
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

export default function TagsManagementPage() {
  const hasMounted = useHasMounted();
  const { t } = useTranslation();

  const [tags, setTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Chakra UI color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tagBg = useColorModeValue("teal.100", "teal.700");
  const tagColor = useColorModeValue("teal.800", "teal.100");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const authToken = await auth.currentUser?.getIdToken();

    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

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
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toaster.create({
        title: t("tagManagement.toasts.tagNameMissing.title"),
        description: t("tagManagement.toasts.tagNameMissing.description"),
        type: "warning",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    // Check if tag already exists
    if (
      tags.some((tag) => tag.toLowerCase() === newTagName.toLowerCase().trim())
    ) {
      toaster.create({
        title: t("tagManagement.toasts.tagExists.title"),
        description: t("tagManagement.toasts.tagExists.description", {
          tag: newTagName,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tag: newTagName.trim() }),
      });

      if (!response.ok) {
        //get the error message from the response
        const errorData = await response.json();
        const errorMessage =
          errorData.error || t("tagManagement.toasts.addError.description");
        toaster.create({
          title: t("tagManagement.toasts.addError.title"),
          description: errorMessage,
          type: "error",
          duration: 5000,
          meta: { closable: true },
        });
        throw new Error("Failed to add tag");
      }

      setTags([...tags, newTagName.trim()]);

      toaster.create({
        title: t("tagManagement.toasts.tagAdded.title"),
        description: t("tagManagement.toasts.tagAdded.description", {
          tag: newTagName,
        }),
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
      setNewTagName("");
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

  const handleDeleteTag = async (tagName: string) => {
    const authToken = await auth.currentUser?.getIdToken();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tags/${tagName}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete tag");
      }

      setTags(tags.filter((tag) => tag !== tagName));

      toaster.create({
        title: t("tagManagement.toasts.tagDeleted.title"),
        description: t("tagManagement.toasts.tagDeleted.description", {
          tag: tagName,
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

  if (!hasMounted) return null; // Prevents hydration errors

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue("gray.50", "gray.900")}
      color={useColorModeValue("gray.800", "white")}
      display="flex"
      flexDirection="column"
    >
      <Head>
        <title>Manage Tags | RecipeKeeper</title>
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
          <Text fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
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
          <Stack
            direction={{ base: "column", md: "row" }}
            gap={4}
            mb={0}
            width="100%"
          >
            <Input
              placeholder={t("tagManagement.inputPlaceholder")}
              borderWidth="1px"
              borderColor={borderColor}
              value={newTagName}
              size="lg"
              borderRadius="md"
              w="100%" // full width in both column and row
              minH="48px"
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddTag();
                }
              }}
            />
            <Button
              colorPalette="teal"
              size="lg"
              w={{ base: "100%", md: "auto" }} // full width on mobile, auto on desktop
              minH="48px"
              onClick={handleAddTag}
              loading={isAdding}
              loadingText={t("tagManagement.adding")}
              borderRadius="md"
              px={6}
            >
              <LuPlus />
              {t("tagManagement.addButton")}
            </Button>
          </Stack>
        </Box>

        <Box
          borderWidth="1px"
          borderRadius="xl"
          p={6}
          bg={cardBg}
          borderColor={borderColor}
          shadow="md"
        >
          <Flex align="center" mb={6}>
            <LuTag size={24} color="teal" />
            <Heading size="md" ml={2}>
              {t("tagManagement.yourTags")}
            </Heading>
            <Badge ml={3} colorPalette="teal" borderRadius="full" px={2}>
              {tags.length}
            </Badge>
          </Flex>

          {isLoading ? (
            <Flex justify="center" align="center" h="120px">
              <Spinner size="xl" color="teal.500" borderWidth="4px" />
            </Flex>
          ) : tags.length > 0 ? (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} gap={4}>
              {tags.map((tag) => (
                <HStack
                  key={tag}
                  bg={tagBg}
                  color={tagColor}
                  py={2}
                  px={4}
                  borderRadius="full"
                  justify="space-between"
                  transition="all 0.2s"
                  _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                >
                  <Text fontWeight="medium">{tag}</Text>
                  <IconButton
                    aria-label={`Remove ${tag} tag`}
                    size="xs"
                    variant="ghost"
                    colorPalette="teal"
                    onClick={() => handleDeleteTag(tag)}
                    borderRadius="full"
                  >
                    <FiX />
                  </IconButton>
                </HStack>
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
