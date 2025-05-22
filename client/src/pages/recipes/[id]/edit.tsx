import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
import { useHasMounted } from "@/hooks/useHasMounted";
import { RecipeFull } from "@/lib/types/recipe";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/ui/back";
import { useTranslation } from "react-i18next";

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const hasMounted = useHasMounted();
  const [initialData, setInitialData] = useState<RecipeFull | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { user, authChecked } = useAuth();
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");
  const { t } = useTranslation();

  useEffect(() => {
    if (!id || !authChecked) return;

    const fetchRecipe = async () => {
      try {
        let authToken = null;

        if (user) {
          authToken = await user.getIdToken();
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/recipes/${id}`,
          {
            method: "GET",
            headers: {
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setErrorMessage(t("editRecipe.errors.unauthorized"));
          } else if (response.status === 404) {
            setErrorMessage(t("editRecipe.errors.notFound"));
          } else {
            setErrorMessage(t("editRecipe.errors.generic"));
          }
          return;
        }
        const data = await response.json();
        if (!data.recipe) {
          setErrorMessage(t("editRecipe.errors.notfound"));
          return;
        }
        const recipe: RecipeFull = {
          ...data.recipe,
          id: id as string,
        };
        setInitialData(recipe);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setErrorMessage(t("editRecipe.errors.network"));
      }
    };

    fetchRecipe();
  }, [id, authChecked, user]);

  if (errorMessage) {
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
              {t("editRecipe.errorTitle")}
            </Heading>
            <Text fontSize="lg">{errorMessage}</Text>
            <Button
              mt={6}
              colorPalette="teal"
              onClick={() => router.push("/recipes")}
            >
              {t("editRecipe.backToRecipes")}
            </Button>
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }
  if (!initialData && !hasMounted) {
    return (
      <Box
        minH="100vh"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
        display="flex"
        flexDirection="column"
      >
        <Head>
          <title>Public Recipes</title>
          <meta name="description" content="Explore public recipes" />
          <meta name="robots" content="index, follow" />
        </Head>
        <Header />
        <Container maxW="container.md" py={10} flex="1">
          <VStack gap={4} alignItems="center">
            <Spinner size="xl" colorPalette="teal" />
            <Text fontSize="lg"> {t("common.loading")}</Text>
          </VStack>
        </Container>
        <Footer />
      </Box>
    );
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
      {" "}
      <Head>
        <title>Edit Recipe | Recipe Keeper</title>
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
        <BackButton />
        <RecipeModify mode="edit" initialData={initialData ?? undefined} />
      </Container>
      <Footer />
    </Box>
  );
}
