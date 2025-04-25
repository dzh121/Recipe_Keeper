import React from "react";
import { useEffect } from "react";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";
import RecipeList from "@/components/recipes/RecipeList";
import { Box, Container, VStack, Spinner, Text } from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRouter } from "next/router";
import { useHasMounted } from "@/hooks/useHasMounted";
import { Recipe } from "@/lib/types/recipe";

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
  "Homemade",
];

export default function RecipesManage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = await user?.getIdToken();
        const response = await fetch(
          "http://localhost:5000/api/recipes?type=private",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }

        const data = await response.json();
        setRecipes(data.recipes);
        console.log("Fetched recipes:", data.recipes);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      }
    };

    if (user) {
      fetchRecipes();
    }
  }, [user]);

  useEffect(() => {
    if (hasMounted && !isAuthenticated && authChecked) {
      router.push("/recipes");
    }
  }, [hasMounted, isAuthenticated, authChecked]);

  if (!hasMounted) {
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
        <title>Manage Recipes</title>
        <meta name="description" content="Manage Your Recipes" />
        <meta name="robots" content="index, follow" />
      </Head>
      <Header />
      <Container maxW="container.md" py={10} flex="1">
        <RecipeList
          title="Manage Your Recipes"
          recipes={recipes}
          allTags={TAG_OPTIONS}
          allowEdit={true}
          showAddButton={isAuthenticated}
          showPublicTag={true}
          onEditClick={(id) => router.push(`/recipes/${id}/edit`)}
          onAddClick={() => router.push("/recipes/add")}
        />
      </Container>

      <Footer />
    </Box>
  );
}
