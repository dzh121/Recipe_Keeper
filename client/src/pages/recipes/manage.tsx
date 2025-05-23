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
import BackButton from "@/components/ui/back";
import { useTranslation } from "react-i18next";

export default function RecipesManage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;
  const { t } = useTranslation();

  useEffect(() => {
    if (hasMounted && !isAuthenticated && authChecked) {
      router.push("/recipes");
    }
  }, [hasMounted, isAuthenticated, authChecked]);

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
      <Head>
        <title>Manage Recipes</title>
        <meta name="description" content="Manage Your Recipes" />
        <meta name="robots" content="index, follow" />
      </Head>
      <Header />
      <Container maxW="container.md" py={10} flex="1">
        <BackButton />
        <RecipeList
          title={t("titles.manageRecipes")}
          isPublic={false}
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
