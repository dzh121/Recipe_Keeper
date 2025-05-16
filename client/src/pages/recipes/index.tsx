"use client";

import { Box, Container, VStack, Text, Spinner } from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRouter } from "next/router";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuth } from "@/context/AuthContext";
import Head from "next/head";
import RecipeList from "@/components/recipes/RecipeList";
import { useTranslation } from "react-i18next";
import BackButton from "@/components/ui/back";

export default function RecipesIndexPage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const isAuthenticated = !!user;

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
          <VStack gap={4} alignItems="center">
            <Spinner size="xl" colorPalette="teal" />
            <Text fontSize="lg">{t("common.loading")}</Text>
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
        <title>Public Recipes</title>
        <meta name="description" content="Explore public recipes" />
        <meta name="robots" content="index, follow" />
      </Head>
      <Header />
      <Container maxW="container.md" py={10} flex="1">
        <BackButton />
        <RecipeList
          title={t("titles.explore")}
          isPublic={true}
          allowEdit={false}
          showAddButton={isAuthenticated}
          showPublisher={true}
          onAddClick={() => router.push("/recipes/add")}
        />
      </Container>

      <Footer />
    </Box>
  );
}
