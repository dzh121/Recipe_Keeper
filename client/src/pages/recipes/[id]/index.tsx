"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LuChevronLeft,
  LuClock,
  LuLink,
  LuCalendar,
  LuExternalLink,
  LuUtensils,
  LuTimer,
  LuChefHat,
  LuNotebook,
} from "react-icons/lu";
import { MdOutlineRateReview } from "react-icons/md";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Flex,
  Icon,
  HStack,
  Avatar,
  Tag,
  Badge,
  Link,
  Skeleton,
  StackSeparator,
  List,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Head from "next/head";
import { Timestamp } from "firebase/firestore";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuth } from "@/context/AuthContext";

type Recipe = {
  ownerId: string;
  title: string | null;
  link?: string;
  notes: string;
  review: string;
  tags: string[];
  timeToFinish: number | null;
  rating: number;
  isPublic: boolean;
  createdAt: Timestamp | null;
  recipeType: "link" | "homemade";
  // Homemade recipe fields
  ingredients?: string;
  instructions?: string;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
};

type Author = {
  displayName: string;
  photoURL: string;
};

type ErrorState = string | null;

export default function RecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState>(null);

  // Color mode values for consistent theming
  const hasMounted = useHasMounted();
  const borderColorValue = useColorModeValue("gray.200", "gray.600");
  const cardBgValue = useColorModeValue("white", "gray.800");
  const textColorValue = useColorModeValue("gray.600", "gray.300");
  const headingColorValue = useColorModeValue("gray.800", "white");
  const bgValue = useColorModeValue("white", "gray.800");

  // Use the mounted state to set colors after hydration
  const bg = hasMounted ? bgValue : undefined;
  const borderColor = hasMounted ? borderColorValue : undefined;
  const cardBg = hasMounted ? cardBgValue : undefined;
  const textColor = hasMounted ? textColorValue : undefined;
  const headingColor = hasMounted ? headingColorValue : undefined;

  const [formattedDate, setFormattedDate] = useState<string>("");
  const { user, authChecked } = useAuth();

  useEffect(() => {
    if (
      recipe?.createdAt &&
      typeof recipe.createdAt === "object" &&
      "_seconds" in recipe.createdAt &&
      "_nanoseconds" in recipe.createdAt
    ) {
      const { _seconds, _nanoseconds } = recipe.createdAt as {
        _seconds: number;
        _nanoseconds: number;
      };

      const recreated = new Timestamp(_seconds, _nanoseconds).toDate();

      const formatted = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(recreated);

      setFormattedDate(formatted);
    } else {
      setFormattedDate("Unknown date");
    }
  }, [recipe?.createdAt]);

  // Check if the user is authenticated
  useEffect(() => {
    if (!id || !authChecked) return;

    const fetchRecipe = async () => {
      setLoading(true);

      try {
        let authToken = null;

        if (user) {
          authToken = await user.getIdToken();
        }

        const response = await fetch(
          `http://localhost:5000/api/recipes/${id}`,
          {
            method: "GET",
            headers: {
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError("You don't have permission to view this recipe.");
          } else if (response.status === 404) {
            setError("Recipe not found.");
          } else {
            setError("Something went wrong. Please try again.");
          }
          return;
        }

        const data = await response.json();
        setRecipe(data.recipe);

        // Fetch author info if available
        if (data.recipe.ownerId) {
          const authorRef = doc(
            db,
            "users",
            data.recipe.ownerId,
            "public",
            "profile"
          );
          const authorSnapshot = await getDoc(authorRef);
          if (authorSnapshot.exists()) {
            setAuthor(authorSnapshot.data() as Author);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, authChecked, user]);

  const handleGoBack = () => {
    router.back();
  };

  // Helper function to format ingredients as list items
  const formatIngredients = (ingredients: string) => {
    return ingredients.split("\n").filter((line) => line.trim() !== "");
  };

  // Helper function to format instructions as numbered steps
  const formatInstructions = (instructions: string) => {
    return instructions.split("\n").filter((line) => line.trim() !== "");
  };

  // Loading state
  if (!hasMounted || (loading && !recipe && !error)) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Header />
        <Container maxW="container.md" px={{ base: 4, md: 8 }} py={10} flex="1">
          <Button
            variant="ghost"
            mb={6}
            onClick={handleGoBack}
            size="md"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={LuChevronLeft} />
            <Text>Go Back</Text>
          </Button>

          <Box
            boxShadow="sm"
            borderRadius="lg"
            p={6}
            bg={hasMounted ? cardBg : "gray.50"} // fallback for SSR
            borderWidth="1px"
            borderColor={hasMounted ? borderColor : "gray.200"}
          >
            <Skeleton height="40px" width="70%" mb={4} />
            <Skeleton height="24px" width="40%" mb={6} />
            <StackSeparator my={4} />
            <HStack mb={6}>
              <Skeleton height="50px" width="50px" borderRadius="full" />
              <VStack align="start">
                <Skeleton height="20px" width="100px" />
                <Skeleton height="16px" width="150px" />
              </VStack>
            </HStack>
            <Skeleton height="100px" mb={4} />
            <Skeleton height="20px" width="100%" mb={2} />
            <Skeleton height="20px" width="80%" mb={4} />
            <Flex wrap="wrap" gap={2} mb={4}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  height="24px"
                  width="80px"
                  borderRadius="full"
                />
              ))}
            </Flex>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Header />
        <Container maxW="container.md" py={10} flex="1">
          <Button variant="ghost" mb={6} onClick={handleGoBack} size="md">
            <LuChevronLeft />
            <Text ml={2}>Go Back</Text>
          </Button>

          <Box
            boxShadow="sm"
            borderRadius="lg"
            p={6}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            textAlign="center"
          >
            <Heading size="lg" mb={4} color="red.500">
              Error
            </Heading>
            <Text fontSize="lg">{error}</Text>
            <Button
              mt={6}
              colorScheme="teal"
              onClick={() => router.push("/recipes")}
            >
              Return to Recipes
            </Button>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }
  if (!recipe) {
    return null;
  }

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Head>
        <title>{recipe.title} | RecipeKeeper</title>
        <meta
          name="description"
          content={`View ${recipe.title} recipe with notes and details.`}
        />
        {recipe.isPublic ? null : <meta name="robots" content="noindex" />}

        {/* Open Graph for social sharing */}
        <meta property="og:title" content={`${recipe.title} | RecipeKeeper`} />
        <meta
          property="og:description"
          content={
            recipe.notes?.substring(0, 100) || `View ${recipe.title} recipe`
          }
        />
      </Head>

      <Header />

      <Container maxW="container.md" py={10} flex="1">
        <Button variant="ghost" mb={6} onClick={handleGoBack} size="md">
          <LuChevronLeft />
          <Text ml={2}>Go Back</Text>
        </Button>

        <Box
          boxShadow="sm"
          borderRadius="lg"
          p={6}
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack align="stretch" gap={6}>
            {/* Recipe Header */}
            <Box>
              <Flex justify="space-between" align="center">
                <Heading color={headingColor} size="xl" mb={1}>
                  {recipe.title}
                </Heading>
                <Flex gap={2}>
                  <Badge
                    colorPalette={
                      recipe.recipeType === "homemade" ? "orange" : "blue"
                    }
                    px={2}
                    py={1}
                    fontSize="md"
                    borderRadius="md"
                  >
                    {recipe.recipeType === "homemade" ? "Homemade" : "Link"}
                  </Badge>

                  <Badge
                    colorPalette={recipe.isPublic ? "green" : "gray"}
                    fontSize="md"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {recipe.isPublic ? "Public" : "Private"}
                  </Badge>
                </Flex>
              </Flex>

              {/* Recipe timing information */}
              <Flex
                wrap="wrap"
                direction={{ base: "column", md: "row" }}
                gap={4}
                mt={2}
              >
                {recipe.timeToFinish && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuClock} />
                    <Text>{recipe.timeToFinish} minutes total</Text>
                  </HStack>
                )}

                {recipe.recipeType === "homemade" && recipe.prepTime && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuTimer} />
                    <Text>{recipe.prepTime} minutes prep</Text>
                  </HStack>
                )}

                {recipe.recipeType === "homemade" && recipe.cookTime && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuChefHat} />
                    <Text>{recipe.cookTime} minutes cook</Text>
                  </HStack>
                )}

                {recipe.recipeType === "homemade" && recipe.servings && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuUtensils} />
                    <Text>Serves {recipe.servings}</Text>
                  </HStack>
                )}
              </Flex>
            </Box>

            <StackSeparator />

            {/* Author Info */}
            <HStack>
              <Avatar.Root size="md" colorPalette="teal" variant={"solid"}>
                <Avatar.Fallback name={author?.displayName || "Recipe User"} />
                <Avatar.Image src={author?.photoURL || "d"} alt="User Avatar" />
              </Avatar.Root>
              <VStack align="start" gap={0}>
                <Text fontWeight="medium" fontSize="md">
                  {author?.displayName || "Recipe User"}
                </Text>
                <Text color={textColor} fontSize="sm">
                  <Icon as={LuCalendar} mr={1} />
                  Published on {formattedDate}
                </Text>
              </VStack>
            </HStack>

            {/* Rating Stars */}
            {recipe.rating > 0 && (
              <HStack gap={2}>
                <Text fontWeight="medium">Rating:</Text>
                <HStack>
                  {Array(5)
                    .fill("")
                    .map((_, i) => (
                      <Box
                        key={i}
                        color={i < recipe.rating ? "yellow.400" : "gray.300"}
                        fontSize="xl"
                      >
                        ★
                      </Box>
                    ))}
                </HStack>
              </HStack>
            )}

            {/* Recipe Link (for linked recipes) */}
            {recipe.recipeType === "link" && recipe.link && (
              <Box>
                <Flex align="center" gap={2} mb={3}>
                  <Text fontWeight="medium">Recipe Link:</Text>
                </Flex>
                <Link
                  href={recipe.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="teal.500"
                  display="flex"
                  alignItems="center"
                >
                  <Icon as={LuLink} mr={2} />
                  <Text
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {recipe.link}
                  </Text>
                  <Icon as={LuExternalLink} ml={2} />
                </Link>
              </Box>
            )}

            {/* Homemade Recipe Details */}
            {recipe.recipeType === "homemade" && (
              <>
                {/* Ingredients */}
                {recipe.ingredients && (
                  <Box>
                    <HStack bg={bg} p={2} borderRadius="md" mb={2}>
                      <Icon as={LuUtensils} />
                      <Text fontWeight="bold" fontSize="lg">
                        Ingredients
                      </Text>
                    </HStack>

                    <List.Root gap={2} pl={4} fontSize="sm">
                      {formatIngredients(recipe.ingredients).map(
                        (ingredient, idx) => (
                          <List.Item key={idx}>{ingredient}</List.Item>
                        )
                      )}
                    </List.Root>
                  </Box>
                )}

                {/* Instructions */}
                {recipe.instructions && (
                  <Box>
                    <HStack bg={bg} p={2} borderRadius="md" mt={6} mb={2}>
                      <Icon as={LuChefHat} />
                      <Text fontWeight="bold" fontSize="lg">
                        Instructions
                      </Text>
                    </HStack>
                    <List.Root
                      as="ol"
                      gap={3}
                      pl={5}
                      style={{ listStyleType: "decimal" }}
                    >
                      {formatInstructions(recipe.instructions).map(
                        (step, idx) => (
                          <List.Item key={idx} pb={2}>
                            <Flex align="center" gap={2}>
                              <Text>
                                {step.replace(
                                  /^(\(?0*[1-9][0-9]?\)?[\.\):\-]?\s)/,
                                  ""
                                )}
                              </Text>
                            </Flex>
                          </List.Item>
                        )
                      )}
                    </List.Root>
                  </Box>
                )}
              </>
            )}

            {/* Recipe Notes */}
            {recipe.notes && (
              <Box>
                <HStack bg={bg} p={2} borderRadius="md" mt={6} mb={2}>
                  <Icon as={LuNotebook} />
                  <Text fontWeight="bold" fontSize="lg">
                    Notes
                  </Text>
                </HStack>
                <Text whiteSpace="pre-wrap">{recipe.notes}</Text>
              </Box>
            )}

            {/* Recipe Review */}
            {recipe.review && (
              <Box>
                <HStack bg={bg} p={2} borderRadius="md" mt={6} mb={2}>
                  <Icon as={MdOutlineRateReview} />
                  <Text fontWeight="bold" fontSize="lg">
                    Review
                  </Text>
                </HStack>

                <Text whiteSpace="pre-wrap">{recipe.review}</Text>
              </Box>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <Box>
                <Flex wrap="wrap" gap={2}>
                  {recipe.tags.map((tag) => (
                    <Tag.Root
                      key={tag}
                      size="md"
                      colorScheme="teal"
                      borderRadius="full"
                      py={1}
                      px={3}
                    >
                      {tag}
                    </Tag.Root>
                  ))}
                </Flex>
              </Box>
            )}
          </VStack>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
