"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toaster, Toaster } from "@/components/ui/toaster";
import {
  LuClock,
  LuLink,
  LuCalendar,
  LuExternalLink,
  LuUtensils,
  LuTimer,
  LuChefHat,
  LuNotebook,
  LuHeart,
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
import BackButton from "@/components/ui/back";
import { useTranslation } from "react-i18next";
import { Tag as TagType } from "@/lib/types/tag";
import { getAuth } from "firebase/auth";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";
import Image from "next/image";

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
  imageUrl?: string | null;
  kosher?: boolean;
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
  slug: string;
};

type ErrorState = string | null;

export default function RecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const [tagOptions, setTagOptions] = useState<TagType[]>([]);
  const [viewerUid, setViewerUiId] = useState<string | null>(null);

  // Color mode values for consistent theming
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const headingColor = useColorModeValue("gray.800", "white");
  const bg = useColorModeValue("white", "gray.800");
  const hasMounted = useHasMounted();

  // Use the mounted state to set colors after hydration
  // const bg = hasMounted ? bgValue : undefined;
  // const borderColor = hasMounted ? borderColorValue : undefined;
  // const cardBg = hasMounted ? cardBgValue : undefined;
  // const textColor = hasMounted ? textColorValue : undefined;
  // const headingColor = hasMounted ? headingColorValue : undefined;

  const [formattedDate, setFormattedDate] = useState<string>("");
  const { user, authChecked } = useAuth();
  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) {
      setViewerUiId(user.uid);
    }
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/tags`,
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          //get exact error message
          const errorMessage = await response.text();
          console.error("Error fetching tags:", errorMessage);
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setTagOptions(
          (data.tags || []).sort((a: TagType, b: TagType) =>
            a.translations.en.localeCompare(b.translations.en)
          )
        );
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const getFormattedDate = (
      timestamp:
        | Timestamp
        | { _seconds: number; _nanoseconds: number }
        | null
        | undefined
    ): string => {
      if (!timestamp) return "";

      try {
        const normalized =
          typeof (timestamp as Timestamp).toDate === "function"
            ? (timestamp as Timestamp)
            : new Timestamp(
                (
                  timestamp as { _seconds: number; _nanoseconds: number }
                )._seconds,
                (
                  timestamp as { _seconds: number; _nanoseconds: number }
                )._nanoseconds
              );

        const date = normalized.toDate();

        if (isNaN(date.getTime())) {
          console.warn("Invalid date in tag suggestion:", timestamp);
          return "";
        }

        return new Intl.DateTimeFormat(i18n.language, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(date);
      } catch (err) {
        console.warn("Error formatting date:", err, timestamp);
        return "";
      }
    };

    setFormattedDate(getFormattedDate(recipe?.createdAt));
  }, [recipe?.createdAt, i18n.language]);

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

        const response = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/recipes/${id}`,
          {
            method: "GET",
            token: authToken ?? undefined,
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError(t("recipeView.noPermission"));
          } else if (response.status === 404) {
            setError(t("recipeView.notFound"));
          } else {
            setError(t("recipeView.unexpectedError"));
          }
          return;
        }

        const data = await response.json();
        setRecipe(data.recipe);
        if (id) {
          const imageRes = await fetchWithAuthAndAppCheck(
            `${process.env.NEXT_PUBLIC_API_URL}/recipes/get-photo-url/${id}`,
            {
              method: "GET",
              token: authToken ?? undefined,
            }
          );
          if (imageRes.ok) {
            const imageData = await imageRes.json();
            setImageURL(imageData.imageURL);
          }
        }

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
        if (user) {
          const response = await fetchWithAuthAndAppCheck(
            `${process.env.NEXT_PUBLIC_API_URL}/favorites/${id}`,
            {
              method: "GET",
              token: authToken ?? undefined,
            }
          );
          if (response.ok) {
            const data = await response.json();
            setIsFavorite(data.isFavorite);
          } else {
            console.error("Failed to fetch favorite status:", response.status);
          }
        }
      } catch (err) {
        console.error(err);
        setError(t("recipeView.unexpectedError"));
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, authChecked, user, t]);

  // Helper function to format ingredients as list items
  const formatIngredients = (ingredients: string) => {
    return ingredients.split("\n").filter((line) => line.trim() !== "");
  };

  // Helper function to format instructions as numbered steps
  const formatInstructions = (instructions: string) => {
    return instructions.split("\n").filter((line) => line.trim() !== "");
  };

  const toggleFavorite = async () => {
    if (!user) {
      return;
    }
    try {
      const response = await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/favorites/${id}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          token: await user.getIdToken(),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update favorite status.");
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
      toaster.create({
        title: t("recipeView.errorTitle"),
        description: t("recipeView.favoriteError"),
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
    }
  };
  if (!hasMounted) return null;
  // Loading state
  if (loading && !recipe && !error) {
    return (
      <Box
        minH="100vh"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
        display="flex"
        flexDirection="column"
      >
        <Header />
        <Container maxW="container.md" px={{ base: 4, md: 8 }} py={10} flex="1">
          <BackButton />

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
      <Box
        minH="100vh"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
        display="flex"
        flexDirection="column"
      >
        <Header />
        <Container maxW="container.md" py={10} flex="1">
          <BackButton />

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
              {t("recipeView.errorTitle")}
            </Heading>
            <Text fontSize="lg">{error}</Text>
            <Button
              mt={6}
              colorPalette="teal"
              onClick={() => router.push("/recipes")}
            >
              {t("recipeView.goToRecipes")}
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
    <Box
      minH="100vh"
      bg="gray.50"
      color="gray.800"
      _dark={{ bg: "gray.900", color: "white" }}
      display="flex"
      flexDirection="column"
    >
      <Toaster />
      <Head>
        <title>{recipe.title} | Recipe Keeper</title>
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
        <BackButton />

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
              <Heading color={headingColor} size="xl" mb={1}>
                {recipe.title}
              </Heading>

              <Flex
                justify="space-between"
                align="center"
                mt={2}
                wrap="wrap"
                gap={2}
              >
                <Flex gap={2} align="center" flexWrap="wrap">
                  {recipe.kosher && (
                    <Badge
                      colorPalette="purple"
                      size="md"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {t("recipeList.kosherBadge")}
                    </Badge>
                  )}
                  <Badge
                    colorPalette={
                      recipe.recipeType === "homemade" ? "orange" : "blue"
                    }
                    px={2}
                    py={1}
                    size="md"
                    borderRadius="md"
                  >
                    {recipe.recipeType === "homemade"
                      ? t("recipeView.homemade")
                      : t("recipeView.link")}
                  </Badge>
                  <Badge
                    colorPalette={recipe.isPublic ? "green" : "gray"}
                    size="md"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {recipe.isPublic
                      ? t("recipeView.public")
                      : t("recipeView.private")}
                  </Badge>
                </Flex>

                <Flex gap={2} align="center">
                  <Button
                    aria-label="Save as favorite"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={toggleFavorite}
                  >
                    <Icon
                      as={LuHeart}
                      boxSize={5}
                      fill={isFavorite ? "currentcolor" : "none"}
                    />
                  </Button>

                  {viewerUid === recipe.ownerId && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="teal"
                      onClick={() => router.push(`/recipes/${id}/edit`)}
                    >
                      {t("recipeView.edit")}
                    </Button>
                  )}
                </Flex>
              </Flex>

              {imageURL && (
                <Box
                  mt={6}
                  mb={4}
                  position="relative"
                  width="100%"
                  maxHeight="300px"
                  w="100%"
                  overflow="hidden"
                  borderRadius="xl"
                  boxShadow="lg"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Image
                    src={imageURL || ""}
                    alt={
                      recipe?.title ? `${recipe.title} photo` : "Recipe image"
                    }
                    width={800}
                    height={600}
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "300px",
                      objectFit: "contain",
                      display: "block",
                      transition: "transform 0.3s ease-in-out",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  />
                </Box>
              )}

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
                    <Text>
                      {t("recipeView.totalTime", {
                        minutes: recipe.timeToFinish,
                      })}
                    </Text>
                  </HStack>
                )}

                {recipe.recipeType === "homemade" && recipe.prepTime && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuTimer} />
                    <Text>
                      {t("recipeView.prepTime", { minutes: recipe.prepTime })}
                    </Text>
                  </HStack>
                )}

                {recipe.recipeType === "homemade" && recipe.cookTime && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuChefHat} />
                    <Text>
                      {" "}
                      {t("recipeView.cookTime", { minutes: recipe.cookTime })}
                    </Text>
                  </HStack>
                )}

                {recipe.recipeType === "homemade" && recipe.servings && (
                  <HStack color={textColor} gap={1}>
                    <Icon as={LuUtensils} />
                    <Text>
                      {t("recipeView.servings", { count: recipe.servings })}
                    </Text>
                  </HStack>
                )}
              </Flex>
            </Box>

            <StackSeparator />

            {/* Author Info */}
            <Link
              href={author?.slug ? `/user/${author?.slug}` : "#"}
              _hover={{ textDecoration: "none" }}
            >
              <HStack _hover={{ opacity: 0.85 }} cursor="pointer">
                <Avatar.Root size="md" colorPalette="teal" variant="solid">
                  <Avatar.Fallback
                    name={author?.displayName || "Recipe User"}
                  />
                  <Avatar.Image
                    src={author?.photoURL || undefined}
                    alt="User Avatar"
                  />
                </Avatar.Root>
                <VStack align="start" gap={0}>
                  <Text fontWeight="medium" fontSize="md">
                    {author?.displayName || "Recipe User"}
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    <Icon as={LuCalendar} mr={1} />
                    {t("recipeView.published", { date: formattedDate })}
                  </Text>
                </VStack>
              </HStack>
            </Link>

            {/* Rating Stars */}
            {recipe.rating > 0 && (
              <HStack gap={2}>
                <Text fontWeight="medium"> {t("recipeView.rating")}</Text>
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
                  <Text fontWeight="medium">
                    {t("recipeView.recipeLinkLabel")}
                  </Text>
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
                        {t("recipeView.ingredients")}
                      </Text>
                    </HStack>

                    <List.Root gap={2} px={4} fontSize="sm">
                      {formatIngredients(recipe.ingredients).map(
                        (ingredient, idx) => (
                          <List.Item key={idx}>
                            <Text textStyle="md">{ingredient}</Text>
                          </List.Item>
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
                        {t("recipeView.instructions")}
                      </Text>
                    </HStack>
                    <List.Root
                      as="ol"
                      gap={3}
                      px={5}
                      style={{ listStyleType: "decimal" }}
                    >
                      {formatInstructions(recipe.instructions).map(
                        (step, idx) => (
                          <List.Item key={idx} pb={2}>
                            <Flex align="center" gap={2}>
                              <Text textStyle="md">
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
                    {t("recipeView.notes")}
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
                    {t("recipeView.review")}
                  </Text>
                </HStack>

                <Text whiteSpace="pre-wrap">{recipe.review}</Text>
              </Box>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <Box>
                <Flex wrap="wrap" gap={2}>
                  {recipe.tags.map((tagId) => {
                    const translated =
                      tagOptions.find((t) => t.id === tagId)?.translations[
                        i18n.language
                      ] ?? tagId;
                    return (
                      <Tag.Root
                        key={tagId}
                        size="md"
                        colorPalette="teal"
                        borderRadius="full"
                        py={1}
                        px={3}
                      >
                        {translated}
                      </Tag.Root>
                    );
                  })}
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
