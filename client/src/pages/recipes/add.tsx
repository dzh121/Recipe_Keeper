"use client";

import { useState } from "react";
import {
  FiLink,
  FiSave,
  FiClock,
  FiX,
  FiChevronDown,
  FiTag,
  FiHome,
  FiGlobe,
} from "react-icons/fi";
import { LuChevronLeft } from "react-icons/lu";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Textarea,
  Button,
  Flex,
  Icon,
  HStack,
  InputGroup,
  Portal,
  Tabs,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Switch, Tag, Menu } from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useRouter } from "next/router";
import Head from "next/head";
import RecipeModify from "@/components/recipes/RecipeModify";

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

export default function AddRecipePage() {
  const router = useRouter();

  const hasMounted = useHasMounted();
  if (!hasMounted) return null; // Prevents hydration errors

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
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
        <Button variant="ghost" mb={6} onClick={handleGoBack} size="md">
          <LuChevronLeft />
          Go Back
        </Button>
        <RecipeModify mode="add" />
      </Container>

      <Footer />
    </Box>
  );
}
