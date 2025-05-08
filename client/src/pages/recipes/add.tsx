"use client";

import { Box, Container } from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { useHasMounted } from "@/hooks/useHasMounted";
import Head from "next/head";
import RecipeModify from "@/components/recipes/RecipeModify";
import BackButton from "@/components/ui/back";
export default function AddRecipePage() {
  const hasMounted = useHasMounted();
  if (!hasMounted) return null; // Prevents hydration errors

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
        <title>Add Recipe | RecipeKeeper</title>
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

      <Toaster />
      <Header />

      <Container maxW="container.md" py={10} flex="1">
        <BackButton />
        <RecipeModify mode="add" />
      </Container>

      <Footer />
    </Box>
  );
}
