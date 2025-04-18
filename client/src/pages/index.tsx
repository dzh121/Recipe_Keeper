"use client";

import {
  Box,
  HStack,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuSettings,
  LuEye,
  LuShare2,
  LuListChecks,
  LuTag,
} from "react-icons/lu";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const features = [
  {
    title: "Add New Recipe",
    description:
      "Create and save your own recipes with links, ingredients, and steps.",
    icon: LuPlus,
    href: "/recipes/add",
  },
  {
    title: "Search Your Recipes",
    description: "Find recipes you've saved by title, ingredients, or tags.",
    icon: LuSearch,
    href: "/recipes/search",
  },
  {
    title: "Search Public Recipes",
    description:
      "Explore recipes shared by other users in the RecipeKeeper community.",
    icon: LuEye,
    href: "/explore/public",
  },
  {
    title: "Shared With Me",
    description: "View recipes others have shared directly with you.",
    icon: LuShare2,
    href: "/shared",
  },
  {
    title: "Manage Tags",
    description: "Organize your recipes with custom tags for easy filtering.",
    icon: LuTag,
    href: "/tags",
  },
  {
    title: "Edit Your Recipes",
    description: "Update or delete any of your saved recipes.",
    icon: LuListChecks,
    href: "/recipes/manage",
  },
  {
    title: "Settings",
    description: "Change your preferences or log out of your account.",
    icon: LuSettings,
    href: "/settings",
  },
];

export default function Home() {
  return (
    <Box
      minH="100vh"
      bg="gray.50"
      color="gray.800"
      _dark={{ bg: "gray.900", color: "white" }}
      display="flex"
      flexDirection="column"
    >
      <Header />

      <Box flex={1} px={6} py={10} maxW="6xl" mx="auto">
        <VStack gap={2} align="center" textAlign="center" mb={10}>
          <Heading
            as="h1"
            fontSize={{ base: "4xl", md: "5xl" }}
            fontWeight="bold"
            color="teal.500"
          >
            RecipeKeeper
          </Heading>
          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="gray.600"
            _dark={{ color: "gray.400" }}
          >
            Your personal dashboard for organizing, searching, and sharing
            recipes.
          </Text>
        </VStack>

        <SimpleGrid mt={8} columns={{ base: 1, sm: 2, md: 3 }} gap={6}>
          {features.map(({ title, description, icon, href }) => (
            <Link href={href} passHref>
              <Card.Root
                key={title}
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                cursor="pointer"
                p={5}
                borderRadius="xl"
                bg="white"
                _dark={{ bg: "gray.800" }}
              >
                <CardBody display="flex" alignItems="center" gap={4}>
                  <HStack align="center" gap={4}>
                    <Icon as={icon} boxSize={6} />
                    <Text fontWeight="medium" fontSize="lg">
                      {title}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" opacity={0.75}>
                    {description}
                  </Text>
                </CardBody>
              </Card.Root>
            </Link>
          ))}
        </SimpleGrid>
      </Box>

      <Footer />
    </Box>
  );
}
