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
import { useColorModeValue } from "@/components/ui/color-mode";

export default function RecipesManage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = await user?.getIdToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/recipes?type=private`,
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
      <Head>
        <title>Manage Recipes</title>
        <meta name="description" content="Manage Your Recipes" />
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
          title="Manage Your Recipes"
          recipes={recipes}
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
