"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Box,
  Spinner,
  HStack,
  Text,
  Avatar,
  Icon,
  Badge,
  Link,
  Flex,
  Container,
  StackSeparator,
  Stat,
  Grid,
  SimpleGrid,
  Tag,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LuBookOpen, LuChefHat, LuLink } from "react-icons/lu";
import NextLink from "next/link";
import { useColorModeValue } from "@/components/ui/color-mode";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/back";
import { useTranslation } from "react-i18next";
import { Tag as TagType } from "@/lib/types/tag";
import Head from "next/head";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";
import { useHasMounted } from "@/hooks/useHasMounted";

interface UserProfile {
  uid: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
}

interface Recipe {
  id: string;
  title: string;
  isPublic: boolean;
  imageURL?: string;
  recipeType?: "link" | "homemade";
  kosher?: boolean;
  tags?: string[];
}

export default function UserPage() {
  const { slug } = useRouter().query;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const [tagOptions, setTagOptions] = useState<TagType[]>([]);
  const hasMounted = useHasMounted();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const accentColor = useColorModeValue("teal.500", "teal.300");
  const secondaryBg = useColorModeValue("gray.50", "gray.900");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/tags`,
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          //get exact error message
          const errorMessage = await response.text();
          console.error("Error fetching tags:", errorMessage);
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setTagOptions(
          (data.tags || []).sort((a: TagType, b: TagType) =>
            a.translations.en.localeCompare(b.translations.en)
          )
        );
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const slugDoc = await getDoc(doc(db, "slugs", slug));
        if (!slugDoc.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const uid = slugDoc.data().uid;
        const profileRef = doc(db, "users", uid, "public", "profile");
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile({
            uid,
            displayName: data.displayName,
            bio: data.bio ?? undefined,
            photoURL: data.photoURL ?? undefined,
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  useEffect(() => {
    if (!profile?.uid) return;

    const fetchRecipes = async () => {
      try {
        const res = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/recipes/user/${profile.uid}`,
          {
            method: "GET",
          }
        );
        const data = await res.json();
        setRecipes(data.recipes ?? []);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    fetchRecipes();
  }, [profile?.uid]);

  if (loading || !hasMounted) {
    return (
      <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
      >
        <VStack colorPalette="teal">
          <Spinner size="xl" color="colorPalette.600" />
          <Text color="colorPalette.600">
            {hasMounted ? t("userPage.loading") : "Loading..."}
          </Text>
        </VStack>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box
        minH="100vh"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
        display="flex"
        flexDirection="column"
      >
        <Text fontSize="lg">{t("userPage.notFound")}</Text>
      </Box>
    );
  }

  const homemadeCount = recipes.filter(
    (r) => r.recipeType === "homemade"
  ).length;
  const linkCount = recipes.filter((r) => r.recipeType === "link").length;

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={secondaryBg}>
      <Head>
        <title>{`${profile.displayName} - Recipe Keeper`}</title>
        <meta name="description" content="View profile information" />
        <meta name="robots" content="noindex" />
      </Head>
      <Header />

      <Container maxW="container.lg" py={8}>
        <BackButton />
        {/* Profile Header */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          shadow="md"
          borderColor={borderColor}
          borderWidth="1px"
          mb={6}
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={6}
            align={{ base: "center", md: "start" }}
          >
            <Avatar.Root
              colorPalette="teal"
              variant="solid"
              style={{ width: "150px", height: "150px" }}
            >
              <Avatar.Fallback name={profile.displayName || "U"} />
              <Avatar.Image
                src={profile.photoURL || undefined}
                alt="User Avatar"
                borderRadius="full"
              />
            </Avatar.Root>

            <Box flex={1}>
              <Text fontSize="3xl" fontWeight="bold">
                {profile.displayName}
              </Text>

              {profile.bio && (
                <Text fontSize="md" color={mutedText} mt={2} mb={4}>
                  {profile.bio}
                </Text>
              )}

              <StackSeparator my={4} />

              <Grid
                templateColumns={{
                  base: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                }}
                gap={4}
              >
                <Stat.Root>
                  <Stat.Label fontSize="sm" color={mutedText}>
                    {t("userPage.recipes")}
                  </Stat.Label>
                  <Stat.ValueText fontSize="2xl" color={accentColor}>
                    {recipes.length}
                  </Stat.ValueText>
                </Stat.Root>

                <Stat.Root>
                  <Stat.Label fontSize="sm" color={mutedText}>
                    {t("userPage.homemadeStats")}
                  </Stat.Label>
                  <Stat.ValueText fontSize="xl">{homemadeCount}</Stat.ValueText>
                </Stat.Root>

                <Stat.Root>
                  <Stat.Label fontSize="sm" color={mutedText}>
                    {t("userPage.links")}
                  </Stat.Label>
                  <Stat.ValueText fontSize="xl">{linkCount}</Stat.ValueText>
                </Stat.Root>
              </Grid>
            </Box>
          </Flex>
        </Box>

        {/* Recipe List */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="lg"
          shadow="md"
          borderColor={borderColor}
          borderWidth="1px"
        >
          <Flex justify="space-between" align="center" mb={6}>
            <Text fontSize="2xl" fontWeight="semibold">
              {t("userPage.publicRecipes")}
            </Text>
            <Badge
              colorPalette="teal"
              size="md"
              px={3}
              py={1}
              borderRadius="full"
            >
              {recipes.length}{" "}
              {recipes.length === 1
                ? t("userPage.recipes")
                : t("userPage.recipes")}
            </Badge>
          </Flex>

          {recipes.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              p={10}
              bg={secondaryBg}
              borderRadius="md"
            >
              <Icon as={LuBookOpen} fontSize="4xl" color={mutedText} mb={4} />
              <Text fontSize="lg" color={mutedText}>
                {t("userPage.noPublicRecipes")}
              </Text>
            </Flex>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
              {recipes.map((recipe) => (
                <Link
                  as={NextLink}
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  _hover={{ textDecoration: "none" }}
                >
                  <Box
                    p={0}
                    w="100%"
                    borderWidth="1px"
                    borderRadius="md"
                    bg={cardBg}
                    borderColor={borderColor}
                    _hover={{
                      shadow: "lg",
                      transform: "translateY(-2px)",
                      borderColor: "teal.200",
                    }}
                    transition="all 0.3s"
                    height="100%"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                  >
                    {/* Image Section */}
                    {recipe.imageURL && (
                      <Box
                        width="100%"
                        height="160px"
                        overflow="hidden"
                        bg="gray.50"
                        _dark={{ bg: "gray.800" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Image
                          src={recipe.imageURL}
                          alt={recipe.title || "Recipe Image"}
                          width={300}
                          height={160}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </Box>
                    )}

                    {/* Content Section */}
                    <VStack align="start" p={5} flex={1} gap={3}>
                      {/* Header with Icon and Title */}
                      <HStack justify="space-between" w="100%">
                        <HStack gap={3}>
                          <Icon
                            as={
                              recipe.recipeType === "homemade"
                                ? LuChefHat
                                : LuLink
                            }
                            color={accentColor}
                            size="lg"
                          />
                          <Text
                            fontWeight="bold"
                            fontSize="lg"
                            color={accentColor}
                            lineHeight="short"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              wordBreak: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {recipe.title || "Untitled Recipe"}
                          </Text>
                        </HStack>
                      </HStack>

                      {/* Tags Section */}
                      {recipe.tags && recipe.tags.length > 0 && (
                        <Flex wrap="wrap" gap={2} w="100%">
                          {recipe.tags.map((tagId) => {
                            const tagObj = tagOptions.find(
                              (t) => t.id === tagId
                            );
                            const label =
                              tagObj?.translations[i18n.language] ??
                              tagObj?.translations.en ??
                              tagId;

                            return (
                              <Tag.Root
                                key={tagId}
                                size="sm"
                                borderRadius="full"
                                variant="subtle"
                                cursor="pointer"
                              >
                                <Tag.Label>{label}</Tag.Label>
                              </Tag.Root>
                            );
                          })}
                        </Flex>
                      )}
                    </VStack>
                  </Box>
                </Link>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Container>

      <Box mt="auto">
        <Footer />
      </Box>
    </Box>
  );
}
