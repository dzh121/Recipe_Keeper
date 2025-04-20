"use client";

import { useState } from "react";
import {
  FiLink,
  FiSave,
  FiClock,
  FiX,
  FiChevronDown,
  FiTag,
} from "react-icons/fi";
import { LuChevronLeft } from "react-icons/lu";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Textarea,
  Button,
  Flex,
  Icon,
  HStack,
  InputGroup,
  Portal,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Switch, Tag, Menu } from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useRouter } from "next/router";
import Head from "next/head";
const TAG_OPTIONS = [
  "Quick",
  "Vegan",
  "Vegetarian",
  "Dessert",
  "Family",
  "Spicy",
  "Healthy",
  "Comfort Food",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Gluten-Free",
  "Low-Carb",
  "High-Protein",
];

export default function AddRecipePage() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [review, setReview] = useState("");
  const [timeToFinish, setTimeToFinish] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const hasMounted = useHasMounted();
  if (!hasMounted) return null; // Prevents hydration errors
  // Color mode values for consistent theming
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearch("");
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const filteredTags = TAG_OPTIONS.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const validateForm = () => {
    let isValid = true;
    let errorMessage = "";

    if (!title.trim()) {
      isValid = false;
      errorMessage = "Please enter a recipe title before saving.";
    } else if (!link.trim()) {
      isValid = false;
      errorMessage = "Please enter a recipe link before saving.";
    } else if (!selectedTags.length) {
      isValid = false;
      errorMessage = "Please select at least one tag before saving.";
    }

    if (isValid) {
      return true;
    }
    toaster.create({
      title: "Missing information",
      description: errorMessage,
      type: "error",
      duration: 3000,
      meta: { closable: true },
    });

    return false;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Save to db /api/recipes
      const authToken = await auth.currentUser?.getIdToken();
      const response = await fetch("http://localhost:5000/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title,
          link,
          notes,
          isPublic,
          tags: selectedTags,
          review,
          timeToFinish: Number(timeToFinish),
          rating: Number(rating),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        toaster.create({
          title: "Save Error",
          description: errorData.message || "Failed to save recipe.",
          type: "error",
          duration: 3000,
          meta: { closable: true },
        });
        return;
      }
      const data = await response.json();
      console.log("Recipe saved successfully:", data);
      // Reset form fields
      setTitle("");
      setLink("");
      setNotes("");
      setIsPublic(false);
      setSelectedTags([]);
      setTagSearch("");
      setReview("");
      setTimeToFinish("");
      setRating(0);
      setHoveredRating(0);
      // Show success message
      toaster.create({
        title: "Recipe Saved",
        description:
          "Your recipe has been successfully saved to your collection.",
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
    } catch (error) {
      toaster.create({
        title: "Save Failed",
        description:
          "There was a problem saving your recipe. Please try again.",
        type: "error",
        duration: 4000,
        meta: { closable: true },
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Head>
        <title>Add Recipe | RecipeKeeper</title>
        <meta
          name="description"
          content="Add your favorite recipes with notes, tags, and links. Keep them private or share them with others."
        />
        <meta name="robots" content="noindex" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="Add Recipe | RecipeKeeper" />
        <meta
          property="og:description"
          content="Easily save recipes with your own notes, time to cook, and more."
        />
      </Head>

      <Toaster />
      <Header />

      <Container maxW="container.md" py={10} flex="1">
        <Button variant="ghost" mb={6} onClick={handleGoBack} size="md">
          <LuChevronLeft />
          Go Back
        </Button>
        <Box
          boxShadow="sm"
          borderRadius="lg"
          p={6}
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack gap={8} align="stretch">
            <Box>
              <Heading fontSize="2xl" mb={2}>
                Add a Recipe
              </Heading>
              <Text color="gray.500">
                Save your favorite recipes and customize them with notes and
                tags.
              </Text>
            </Box>

            <VStack gap={6} align="stretch">
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Recipe Title{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Input
                  placeholder="e.g. Chocolate Chip Cookies"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Recipe Link{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <InputGroup
                  startElement={<Icon as={FiLink} color="gray.400" />}
                >
                  <Input
                    type="url"
                    placeholder="https://example.com/my-favorite-recipe"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </InputGroup>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enter the URL of the recipe you'd like to save
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Notes
                </Text>
                <Textarea
                  placeholder="Why you like it, changes you'd make, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={4}
                />
              </Box>

              <HStack gap={6} align="flex-start">
                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Time to Finish
                  </Text>
                  <InputGroup startElement={<Icon as={FiClock} />}>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Minutes"
                      value={timeToFinish}
                      onChange={(e) => setTimeToFinish(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                  </InputGroup>
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Rating
                  </Text>
                  <HStack gap={2}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Box
                        key={star}
                        as="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        color={
                          hoveredRating > 0
                            ? star <= hoveredRating
                              ? "yellow.300"
                              : "gray.300"
                            : star <= rating
                            ? "yellow.400"
                            : "gray.300"
                        }
                        fontSize="2xl"
                        cursor="pointer"
                        transition="color 0.2s"
                      >
                        ★
                      </Box>
                    ))}
                  </HStack>
                </Box>
              </HStack>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Your Review
                </Text>
                <Textarea
                  placeholder="How was it? Would you make it again?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={3}
                />
              </Box>

              <Box>
                <Text fontWeight="medium" mb={3}>
                  Tags{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>

                {/* Selected Tags Display */}
                <Flex wrap="wrap" gap={2} mb={3}>
                  {selectedTags.map((tag) => (
                    <Tag.Root
                      asChild
                      key={tag}
                      size="md"
                      variant="solid"
                      colorScheme="teal"
                      borderRadius="full"
                      py={1}
                      px={3}
                    >
                      <button
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <Tag.Label>{tag} </Tag.Label>
                        <FiX />
                      </button>
                    </Tag.Root>
                  ))}
                </Flex>

                {/* Tag Dropdown with correct Chakra UI Menu structure */}
                <Menu.Root closeOnSelect={false}>
                  <Menu.Trigger asChild>
                    <Button size="sm" colorScheme="teal" variant="outline">
                      <Icon as={FiTag} />
                      Add Tags
                      <FiChevronDown />
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content maxH="250px" overflowY="auto" minW="200px">
                        <Box px={3} py={2}>
                          <Input
                            placeholder="Search tags..."
                            size="sm"
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            borderColor={borderColor}
                            _focus={{ borderColor: "teal.400" }}
                          />
                        </Box>

                        {filteredTags.length > 0 ? (
                          filteredTags.map((tag) => (
                            <Menu.Item
                              key={tag}
                              value={tag}
                              onClick={() => handleAddTag(tag)}
                            >
                              {tag}
                            </Menu.Item>
                          ))
                        ) : (
                          <Box
                            px={3}
                            py={2}
                            textAlign="center"
                            color="gray.500"
                          >
                            No tags found
                          </Box>
                        )}
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Box>

              <HStack justify="space-between">
                <Text></Text>
                <HStack>
                  <Text fontWeight="medium">Public</Text>
                  <Switch.Root
                    colorPalette="teal"
                    checked={isPublic}
                    onCheckedChange={(e) => setIsPublic(e.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control
                      bg={isPublic ? "teal.500" : "gray.300"}
                      borderRadius="full"
                    >
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>
              </HStack>
            </VStack>

            <Flex justify="flex-end" mt={4}>
              <Button
                colorScheme="teal"
                onClick={handleSave}
                loading={isSubmitting}
                loadingText="Saving"
                size="lg"
                px={8}
                borderRadius="md"
                _hover={{ transform: "translateY(-1px)", boxShadow: "sm" }}
              >
                <FiSave />
                Save Recipe
              </Button>
            </Flex>
          </VStack>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
