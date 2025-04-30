"use client";

import { LuChevronLeft } from "react-icons/lu";
import { Box, Container, Button } from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useRouter } from "next/router";
import Head from "next/head";
import RecipeModify from "@/components/recipes/RecipeModify";
import { useColorModeValue } from "@/components/ui/color-mode";
export default function AddRecipePage() {
  const router = useRouter();
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const hasMounted = useHasMounted();
  if (!hasMounted) return null; // Prevents hydration errors

  const handleGoBack = () => {
    router.back();
  };

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
        <RecipeModify mode="add" />
      </Container>

      <Footer />
    </Box>
  );
}
