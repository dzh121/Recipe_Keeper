"use client";
import { useEffect, useState } from "react";
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
  Spinner,
} from "@chakra-ui/react";
import {
  LuPlus,
  LuSearch,
  LuSettings,
  LuListChecks,
  LuTag,
} from "react-icons/lu";
import { MdOutlineFavoriteBorder } from "react-icons/md";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Head from "next/head";
const features = [
  {
    title: "My Recipes",
    description:
      "Access all the recipes you’ve created or saved from the community.",
    icon: LuListChecks,
    href: "/recipes/manage",
    requiresAuth: true,
  },
  {
    title: "Favorite Recipes",
    description: "Access your favorite recipes in one convenient place.",
    icon: MdOutlineFavoriteBorder,
    href: "/recipes/favorites",
    requiresAuth: false,
  },
  {
    title: "Explore Public Recipes",
    description: "Discover new ideas and save recipes shared by other users.",
    icon: LuSearch,
    href: "/recipes",
    requiresAuth: false,
  },
  {
    title: "Add New Recipe",
    description:
      "Create and save your own recipes with ingredients, instructions, and more.",
    icon: LuPlus,
    href: "/recipes/add",
    requiresAuth: true,
    adminOnly: true,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setAdminChecked(true);
        return;
      }

      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims;

      if (claims.role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setAdminChecked(true);
    };

    if (authChecked) {
      checkAdminRole();
    }
  }, [user, authChecked]);

  if (!authChecked || !adminChecked) {
    return (
      <Box
        minH="100vh"
        display="flex"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="xl" colorPalette="teal" />
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
          {features.map(
            ({ title, description, icon, href, requiresAuth, adminOnly }) => {
              const shouldHide = adminOnly && authChecked && !isAdmin;
              const needsLogin = requiresAuth && authChecked && !user;

              if (shouldHide) return null;

              const CardContent = (
                <Card.Root
                  p={5}
                  borderRadius="xl"
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                  cursor="pointer"
                  opacity={needsLogin ? 0.85 : 1}
                >
                  <CardBody
                    display="flex"
                    alignItems="center"
                    flexDirection="column"
                    height="100%"
                    gap={4}
                  >
                    <HStack align="center" gap={4}>
                      <Icon as={icon} boxSize={6} />
                      <Text fontWeight="medium" fontSize="lg">
                        {title}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" opacity={0.75} mt={2}>
                      {description}
                    </Text>

                    {/* Always render something here so height is same */}
                    {needsLogin ? (
                      <Text fontSize="xs" mt={2} color="red.500">
                        Login required to use this feature
                      </Text>
                    ) : (
                      <Text fontSize="xs" mt={2} visibility="hidden">
                        Login required
                      </Text>
                    )}
                  </CardBody>
                </Card.Root>
              );

              return needsLogin ? (
                <Box
                  key={title}
                  onClick={() => (window.location.href = "/signin")}
                >
                  {CardContent}
                </Box>
              ) : (
                <Link href={href} passHref key={title}>
                  {CardContent}
                </Link>
              );
            }
          )}
        </SimpleGrid>
      </Box>

      <Footer />
    </Box>
  );
}
