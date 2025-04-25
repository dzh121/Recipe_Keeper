import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";
import RecipeModify from "@/components/recipes/RecipeModify";
import {
  Box,
  Container,
  Button,
  VStack,
  Spinner,
  Text,
  Heading,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import Head from "next/head";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LuChevronLeft } from "react-icons/lu";
import { useHasMounted } from "@/hooks/useHasMounted";
import { RecipeFull } from "@/lib/types/recipe";
import { useAuth } from "@/context/AuthContext";

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const hasMounted = useHasMounted();
  const [initialData, setInitialData] = useState<RecipeFull | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { user, authChecked } = useAuth();
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");
  useEffect(() => {
    if (!id || !authChecked) return;

    const fetchRecipe = async () => {
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
          if (response.status === 401) {
            setErrorMessage("You are not authorized to view this recipe.");
          } else if (response.status === 404) {
            setErrorMessage("Recipe not found.");
          } else {
            setErrorMessage("An unexpected error occurred.");
          }
          return;
        }
        const data = await response.json();
        console.log("Fetched recipe data:", data);
        if (!data.recipe) {
          setErrorMessage("Recipe not found.");
          return;
        }
        setInitialData({
          ...data.recipe,
          id: id as string,
        });
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setErrorMessage("Network error. Please try again.");
      }
    };

    fetchRecipe();
  }, [id, authChecked, user]);
  useEffect(() => {
    console.log("Initial data:", initialData);
  }, [initialData]);
  const handleGoBack = () => {
    router.back();
  };
  if (errorMessage) {
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
            <Text fontSize="lg">{errorMessage}</Text>
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
  if (!initialData && !hasMounted) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Head>
          <title>Public Recipes</title>
          <meta name="description" content="Explore public recipes" />
          <meta name="robots" content="index, follow" />
        </Head>
        <Header />
        <Container maxW="container.md" py={10} flex="1">
          <VStack gap={4} alignItems="center">
            <Spinner size="xl" colorScheme="teal" />
            <Text fontSize="lg">Loading...</Text>
          </VStack>
        </Container>
        <Footer />
      </Box>
    );
  }
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Head>
        <title>Edit Recipe | RecipeKeeper</title>
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

      <Header />

      <Container maxW="container.md" py={10} flex="1">
        <Button variant="ghost" mb={6} onClick={handleGoBack} size="md">
          <LuChevronLeft />
          Go Back
        </Button>
        <RecipeModify mode="edit" initialData={initialData ?? undefined} />
      </Container>

      <Footer />
    </Box>
  );
}
