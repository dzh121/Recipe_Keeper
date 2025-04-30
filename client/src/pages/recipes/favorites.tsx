import React from "react";
import { useEffect } from "react";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";
import RecipeList from "@/components/recipes/RecipeList";
import {
  Box,
  Container,
  VStack,
  Spinner,
  Text,
  Button,
} from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRouter } from "next/router";
import { useHasMounted } from "@/hooks/useHasMounted";
import { Recipe } from "@/lib/types/recipe";
import { LuChevronLeft } from "react-icons/lu";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useColorModeValue } from "@/components/ui/color-mode";
export default function RecipesManage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      try {
        const token = await user?.getIdToken();

        // Get favorite IDs
        const favoritesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/favorites`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!favoritesRes.ok) {
          throw new Error("Failed to fetch favorites");
        }

        const favoritesData = await favoritesRes.json();

        const favoriteIds = favoritesData.favorites.map((fav: any) => fav);
        if (favoriteIds.length === 0) {
          setRecipes([]);
          return;
        }

        // Fetch only favorite recipes
        const recipesRes = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/recipes?ids=${favoriteIds.join(",")}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!recipesRes.ok) {
          throw new Error("Failed to fetch favorite recipes");
        }

        const recipesData = await recipesRes.json();
        setRecipes(recipesData.recipes);

        console.log("Fetched favorite recipes:", recipesData.recipes);
      } catch (err) {
        console.error("Error fetching favorite recipes:", err);
      }
    };

    if (user) {
      fetchFavoriteRecipes();
    }
  }, [user]);

  useEffect(() => {
    if (hasMounted && !isAuthenticated && authChecked) {
      router.push("/recipes");
    }
  }, [hasMounted, isAuthenticated, authChecked]);
  const removeFavorite = async (recipeId: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/${recipeId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }

      const data = await response.json();
      console.log("Removed favorite:", data);
      setRecipes((prevRecipes) =>
        prevRecipes.filter((recipe) => recipe.id !== recipeId)
      );
    } catch (err) {
      console.error("Error removing favorite:", err);
      toaster.create({
        title: "Error",
        description: "Failed to update favorite status.",
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };
  if (!hasMounted) {
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
          <VStack gap={4} alignItems="center">
            <Spinner size="xl" colorPalette="teal" />
            <Text fontSize="lg">Loading...</Text>
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
      <Toaster />
      <Head>
        <title>Favorite Recipes</title>
        <meta name="description" content="Your Favorite Recipes" />
        <meta name="robots" content="index, follow" />
      </Head>
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
        <RecipeList
          title="Favorite Recipes"
          recipes={recipes}
          allowEdit={false}
          showAddButton={false}
          showPublicTag={true}
          showPublisher={true}
          showFavorite={true}
          onFavoriteClick={(recipeId: string) => {
            removeFavorite(recipeId);
          }}
        />
      </Container>

      <Footer />
    </Box>
  );
}
