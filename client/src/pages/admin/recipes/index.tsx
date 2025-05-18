"use client";

import { Box, Container, VStack, Text, Spinner } from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/back";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHasMounted } from "@/hooks/useHasMounted";
import RecipeList from "@/components/recipes/RecipeList";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function AdminRecipesPage() {
  const { user, authChecked } = useAuth();
  const hasMounted = useHasMounted();
  const router = useRouter();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!authChecked) return;

      if (!user) {
        router.push("/login");
        return;
      }

      const tokenResult = await user.getIdTokenResult();
      if (tokenResult.claims.owner) {
        setIsAdmin(true);
      } else {
        router.replace("/"); // Redirect if n ot admin
      }
    };

    checkAdmin();
  }, [user, authChecked]);

  if (!hasMounted || !authChecked) {
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
          <title>Admin Recipes</title>
          <meta name="description" content="Manage all recipes as admin" />
          <meta name="robots" content="noindex" />
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

  if (!isAdmin) return null;

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
        <title>Admin Recipes</title>
        <meta name="description" content="Manage all recipes as admin" />
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <Container maxW="container.md" py={10} flex="1">
        <BackButton />
        <RecipeList
          title={t("titles.adminRecipes")}
          showPublicTag={true}
          showPublisher={true}
          owner={true}
        />
      </Container>
      <Footer />
    </Box>
  );
}
