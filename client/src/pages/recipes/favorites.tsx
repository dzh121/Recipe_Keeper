import React from "react";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";
import RecipeList from "@/components/recipes/RecipeList";
import { Box, Container, VStack, Spinner, Text } from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRouter } from "next/router";
import { useHasMounted } from "@/hooks/useHasMounted";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";
import BackButton from "@/components/ui/back";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";

export default function RecipesManage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;
  const { t } = useTranslation();

  useEffect(() => {
    if (hasMounted && !isAuthenticated && authChecked) {
      router.push("/recipes");
    }
  }, [hasMounted, isAuthenticated, authChecked, router]);
  const removeFavorite = async (recipeId: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/favorites/${recipeId}`,
        {
          method: "DELETE",
          token,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove favorite");
      }

      toaster.create({
        title: t("common.success"),
        description: t("recipeList.removedFromFavorites"),
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
      setRefreshKey((prev) => prev + 1);
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
          <BackButton />
          <VStack gap={4} alignItems="center">
            <Spinner size="xl" colorPalette="teal" />
            <Text fontSize="lg">
              {hasMounted ? t("common.loading") : "Loading..."}
            </Text>
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
        <BackButton />
        <RecipeList
          title={t("titles.favorites")}
          allowEdit={false}
          showAddButton={false}
          showPublicTag={true}
          showPublisher={true}
          showFavorite={true}
          onlyFavorites={true}
          onFavoriteClick={(recipeId: string) => {
            removeFavorite(recipeId);
          }}
          refreshKey={refreshKey}
        />
      </Container>

      <Footer />
    </Box>
  );
}
