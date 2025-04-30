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
import { LuChevronLeft, LuPlus, LuTag } from "react-icons/lu";
import { FiX } from "react-icons/fi";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useRouter } from "next/router";
import { toaster, Toaster } from "@/components/ui/toaster";
import Head from "next/head";
import { auth } from "@/lib/firebase";

export default function TagsManagementPage() {
  const router = useRouter();
  const hasMounted = useHasMounted();

  const [tags, setTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Chakra UI color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tagBg = useColorModeValue("teal.100", "teal.700");
  const tagColor = useColorModeValue("teal.800", "teal.100");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const authToken = await auth.currentUser?.getIdToken();

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tags`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      toaster.create({
        title: "Error fetching tags",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
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
        title: "Tag name required",
        description: "Please enter a name for the tag",
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
        title: "Tag already exists",
        description: `"${newTagName}" already exists in your tags`,
        type: "warning",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }
    const authToken = await auth.currentUser?.getIdToken();

    try {
      setIsAdding(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ tag: newTagName.trim() }),
        }
      );

      if (!response.ok) {
        //get the error message from the response
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to add tag";
        toaster.create({
          title: "Error adding tag",
          description: errorMessage,
          type: "error",
          duration: 5000,
          meta: { closable: true },
        });
        throw new Error("Failed to add tag");
      }

      const newTag = await response.json();
      setTags([...tags, newTagName.trim()]);

      console.log("Tag added:", newTag);
      toaster.create({
        title: "Tag added",
        description: `"${newTagName}" has been added to your tags`,
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
      setNewTagName("");
    } catch (error) {
      toaster.create({
        title: "Error adding tag",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
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
        title: "Tag deleted",
        description: `"${tagName}" has been removed from your tags`,
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
    } catch (error) {
      toaster.create({
        title: "Error deleting tag",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
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
        <Button
          variant="outline"
          mb={8}
          onClick={handleGoBack}
          size="md"
          borderRadius="full"
          _hover={{ bg: hoverBg }}
        >
          <LuChevronLeft />
          Back
        </Button>
        <VStack gap={6} align="stretch" mb={8}>
          <Heading size="xl" fontWeight="bold">
            Manage Recipe Tags
          </Heading>
          <Text fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
            Add, view, and remove tags to better organize your recipe
            collection.
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
              placeholder="Enter new tag (e.g., vegan, dessert, spicy)"
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
              loadingText="Adding"
              borderRadius="md"
              px={6}
            >
              <LuPlus />
              Add Tag
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
              Your Tags
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
                No tags found. Add your first tag to get started.
              </Text>
            </Box>
          )}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
