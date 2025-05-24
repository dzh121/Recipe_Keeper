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
  Skeleton,
} from "@chakra-ui/react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Head from "next/head";
import { useFeatureList } from "@/hooks/useFeatureList";
import { useTranslation } from "react-i18next";
import { useHasMounted } from "@/hooks/useHasMounted";

export default function Home() {
  const { user, authChecked } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const features = useFeatureList();
  const { t } = useTranslation();
  const hasMounted = useHasMounted();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setAdminChecked(true);
        return;
      }

      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims;

      if (claims.admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      if (claims.owner) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
      setAdminChecked(true);
    };

    if (authChecked) {
      checkAdminRole();
    }
  }, [user, authChecked]);
  const isLoading = !authChecked || !adminChecked;

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      color="gray.800"
      _dark={{ bg: "gray.900", color: "white" }}
      display="flex"
      flexDirection="column"
    >
      <Box as="nav" display="none" aria-hidden="true">
        <Link href="/recipes">Recipes</Link>
        <Link href="/recipes/add">Add Recipe</Link>
        <Link href="/tags/suggest">Suggest Tags</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/signin">Sign In</Link>
      </Box>
      <Head>
        <title>Recipe Keeper</title>
        <link rel="canonical" href="https://recipekeeper-3a217.web.app/" />
        <meta name="description" content="Your personal recipe dashboard" />
        <meta property="og:title" content="Recipe Keeper" />
        <meta
          property="og:description"
          content="Your personal recipe dashboard"
        />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Recipe Keeper",
            url: "https://recipekeeper-3a217.web.app",
          })}
        </script>
      </Head>
      <Header />

      <Box flex={1} px={6} py={10} maxW="6xl" mx="auto">
        <VStack gap={2} align="center" textAlign="center" mb={10}>
          <Heading
            as="h1"
            fontSize={{ base: "4xl", md: "5xl" }}
            fontWeight="bold"
            color="teal.500"
            mb={2}
          >
            {hasMounted
              ? t("app.title", { defaultValue: "Recipe Keeper" })
              : "Recipe Keeper"}
          </Heading>
          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="gray.600"
            _dark={{ color: "gray.400" }}
          >
            {hasMounted
              ? t("app.description", {
                  defaultValue:
                    "Your personal dashboard for organizing, searching, and sharing recipes.",
                })
              : "Your personal dashboard for organizing, searching, and sharing recipes."}
          </Text>
        </VStack>

        <SimpleGrid
          mt={6}
          columns={{ base: 2, sm: 2, md: 3 }}
          gap={{ base: 4, md: 6 }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card.Root
                  key={`skeleton-${i}`}
                  p={{ base: 3, md: 5 }}
                  borderRadius="lg"
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  height="100%"
                >
                  <CardBody
                    display="flex"
                    flexDir="column"
                    alignItems="center"
                    justifyContent="center"
                    gap={3}
                    height="full"
                  >
                    <Skeleton height="20px" width="60%" mb={2} />
                    <Skeleton height="14px" width="80%" />
                    <Skeleton height="14px" width="80%" />
                    <Skeleton height="14px" width="40%" />
                  </CardBody>
                </Card.Root>
              ))
            : features.map(
                ({
                  title,
                  description,
                  icon,
                  href,
                  requiresAuth,
                  adminOnly,
                  ownerOnly,
                }) => {
                  const shouldHide =
                    authChecked &&
                    ((adminOnly && !isAdmin) || (ownerOnly && !isOwner));

                  const needsLogin = requiresAuth && authChecked && !user;

                  if (shouldHide) return null;

                  const CardContent = (
                    <Card.Root
                      p={{ base: 3, md: 5 }}
                      borderRadius="lg"
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      _hover={{
                        boxShadow: "md",
                        transform: "translateY(-2px)",
                      }}
                      transition="all 0.2s"
                      cursor="pointer"
                      opacity={needsLogin ? 0.85 : 1}
                      height="100%"
                    >
                      <CardBody
                        display="flex"
                        flexDir="column"
                        alignItems="center"
                        gap={3}
                        height="full"
                      >
                        <HStack align="center" gap={2}>
                          <Icon as={icon} boxSize={5} />
                          <Text
                            fontWeight="medium"
                            fontSize="md"
                            textAlign="center"
                          >
                            {title}
                          </Text>
                        </HStack>

                        <Text fontSize="xs" opacity={0.75} textAlign="center">
                          {description}
                        </Text>

                        {needsLogin ? (
                          <Text fontSize="xs" color="red.500">
                            {t("app.loginRequired")}
                          </Text>
                        ) : (
                          <Text fontSize="xs" visibility="hidden">
                            Placeholder
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
