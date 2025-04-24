"use client";
import { useAuth } from "@/context/AuthContext";
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
  LuListChecks,
  LuTag,
} from "react-icons/lu";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Head from "next/head";
const features = [
  {
    title: "Add New Recipe",
    description:
      "Create and save your own recipes with ingredients, instructions, and more.",
    icon: LuPlus,
    href: "/recipes/add",
    requiresAuth: true,
  },
  {
    title: "My Recipes",
    description:
      "Access all the recipes you’ve created or saved from the community.",
    icon: LuListChecks,
    href: "/recipes/manage",
    requiresAuth: true,
  },
  {
    title: "Explore Public Recipes",
    description: "Discover new ideas and save recipes shared by other users.",
    icon: LuSearch,
    href: "/recipes",
    requiresAuth: false,
  },
  {
    title: "Manage Tags",
    description:
      "Customize and organize your tags to easily filter and find recipes.",
    icon: LuTag,
    href: "/tags",
    requiresAuth: true,
  },
  {
    title: "Settings",
    description:
      "Update your profile, preferences, and manage your account settings.",
    icon: LuSettings,
    href: "/settings",
    requiresAuth: true,
  },
];

export default function Home() {
  const { user, authChecked } = useAuth();
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
        <title>RecipeKeeper</title>
        <meta name="description" content="Your personal recipe dashboard" />
        <meta name="robots" content="index, follow" />
      </Head>
      <Header />

      <Box flex={1} px={6} py={10} maxW="6xl" mx="auto">
        <VStack gap={2} align="center" textAlign="center" mb={10}>
          <Heading
            as="h1"
            fontSize={{ base: "4xl", md: "5xl" }}
            marginBottom={2}
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
          {features.map(({ title, description, icon, href, requiresAuth }) => {
            const isProtected = requiresAuth && authChecked && !user;

            return isProtected ? (
              <Card.Root
                key={title}
                p={5}
                borderRadius="xl"
                bg="white"
                _dark={{ bg: "gray.800" }}
                opacity={0.85}
                cursor="pointer"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                onClick={() => (window.location.href = "/signin")}
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
                  <Text fontSize="xs" mt={2} color="red.500">
                    Login required to use this feature
                  </Text>
                </CardBody>
              </Card.Root>
            ) : (
              <Link href={href} passHref key={title}>
                <Card.Root
                  p={5}
                  borderRadius="xl"
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                  cursor="pointer"
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
            );
          })}
        </SimpleGrid>
      </Box>

      <Footer />
    </Box>
  );
}
