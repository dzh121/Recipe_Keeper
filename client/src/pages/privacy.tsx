"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  StackSeparator,
  List,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import Head from "next/head";
import Header from "@/components/layout/Header";
import { useColorModeValue } from "@/components/ui/color-mode";
import Footer from "@/components/layout/Footer";
import { Lock, Users, Globe, Shield, Database, Mail } from "lucide-react";
import { useHasMounted } from "@/hooks/useHasMounted";
import BackButton from "@/components/ui/back";
export default function PrivacyPage() {
  const sectionBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hasMounted = useHasMounted();
  if (!hasMounted) {
    return (
      <Box
        minH="100vh"
        display="flex"
        bg="gray.50"
        color="gray.800"
        _dark={{ bg: "gray.900", color: "white" }}
      >
        <Spinner size="xl" m="auto" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="gray.50"
      color="gray.800"
      _dark={{ bg: "gray.900", color: "white" }}
    >
      <Head>
        <title>Privacy & Data Policy | Recipe Keeper</title>
        <meta
          name="description"
          content="Understand how RecipeKeeper handles your data and respects your privacy."
        />
      </Head>

      <Header />

      <Container maxW="container.md" py={10} flex={1}>
        <BackButton />
        <VStack align="start" gap={8} width="100%">
          <Box width="100%" textAlign="center">
            <Heading size="xl" mb={2}>
              Privacy & Data Access Policy
            </Heading>
            <Text fontSize="md" color="gray.600" _dark={{ color: "gray.400" }}>
              This document outlines the privacy and data access practices of
              the <strong>RecipeKeeper</strong> application.
            </Text>
          </Box>
          <Box
            width="100%"
            p={6}
            borderRadius="lg"
            bg={sectionBg}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="start" gap={4}>
              <Box display="flex" alignItems="center" width="100%">
                <Icon as={Lock} mr={3} boxSize={6} color="blue.500" />
                <Heading size="md">What Data We Collect</Heading>
              </Box>
              <Text>
                RecipeKeeper stores the following types of user data in
                Firebase:
              </Text>
              <VStack align="start" pl={10} gap={3} width="100%">
                <Box width="100%">
                  <Text fontWeight="bold">User Profile:</Text>
                  <List.Root gap={1} pl={4}>
                    <List.Item>
                      Display name, email, profile picture (if provided)
                    </List.Item>
                  </List.Root>
                </Box>

                <Box width="100%">
                  <Text fontWeight="bold">Recipe Content:</Text>
                  <List.Root gap={1} pl={4}>
                    <List.Item>
                      Title, notes, ingredients, instructions, etc.
                    </List.Item>
                    <List.Item>Optional photo</List.Item>
                    <List.Item>Type (link or homemade)</List.Item>
                    <List.Item>Rating, review, time to finish, etc.</List.Item>
                  </List.Root>
                </Box>

                <Box width="100%">
                  <Text fontWeight="bold">Other Data:</Text>
                  <List.Root gap={1} pl={4}>
                    <List.Item>
                      Tags: Global tags for recipe categorization
                    </List.Item>
                    <List.Item>
                      Favorites: List of recipe IDs marked as favorites by each
                      user
                    </List.Item>
                    <List.Item>
                      Preferences: Language, dark/light mode
                    </List.Item>
                  </List.Root>
                </Box>
              </VStack>
            </VStack>
          </Box>

          <Box
            width="100%"
            p={6}
            borderRadius="lg"
            bg={sectionBg}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="start" gap={4}>
              <Box display="flex" alignItems="center" width="100%">
                <Icon as={Users} mr={3} boxSize={6} color="green.500" />
                <Heading size="md">Who Can Access What</Heading>
              </Box>

              <VStack align="start" pl={10} gap={3} width="100%">
                <Box width="100%">
                  <Text fontWeight="bold">You (the user):</Text>
                  <List.Root gap={1} pl={4}>
                    <List.Item>
                      Can access and manage all your own recipes, tags,
                      settings, and preferences.
                    </List.Item>
                  </List.Root>
                </Box>

                <Box width="100%">
                  <Text fontWeight="bold">Other users:</Text>
                  <List.Root gap={1} pl={4}>
                    <List.Item>
                      Can only view <strong>public</strong> recipes you have
                      shared.
                    </List.Item>
                  </List.Root>
                </Box>

                <Box width="100%">
                  <Text fontWeight="bold">Developer (admin):</Text>
                  <List.Root gap={1} pl={4}>
                    <List.Item>
                      Has access to all recipes (for moderation and maintenance
                      purposes)
                    </List.Item>
                    <List.Item>
                      Does <strong>not</strong> have access to your
                      authentication credentials (passwords or social logins)
                    </List.Item>
                    <List.Item>
                      May view profile metadata for debugging and app
                      improvements
                    </List.Item>
                  </List.Root>
                </Box>
              </VStack>
            </VStack>
          </Box>

          <Box
            width="100%"
            p={6}
            borderRadius="lg"
            bg={sectionBg}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="start" gap={4}>
              <Box display="flex" alignItems="center" width="100%">
                <Icon as={Globe} mr={3} boxSize={6} color="purple.500" />
                <Heading size="md">Sharing Recipes</Heading>
              </Box>

              <List.Root gap={2} pl={10}>
                <List.Item>
                  Recipes marked as <strong>public</strong> are viewable by all
                  users.
                </List.Item>
                <List.Item>
                  Recipes marked as <strong>private</strong> are only visible to
                  the creator.
                </List.Item>
                <List.Item>
                  You can also share <strong>external recipe links</strong>,
                  which are saved and optionally made public.
                </List.Item>
                <List.Item>
                  RecipeKeeper does <strong>not host or own</strong> third-party
                  content. If you are the owner of a linked recipe and want it
                  removed, please contact us.
                </List.Item>
              </List.Root>
            </VStack>
          </Box>

          <Box
            width="100%"
            p={6}
            borderRadius="lg"
            bg={sectionBg}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="start" gap={4}>
              <Box display="flex" alignItems="center" width="100%">
                <Icon as={Shield} mr={3} boxSize={6} color="red.500" />
                <Heading size="md">Security</Heading>
              </Box>

              <List.Root gap={2} pl={10}>
                <List.Item>
                  All access is protected via Firebase Authentication.
                </List.Item>
                <List.Item>
                  Only authenticated users can create or modify recipes.
                </List.Item>
                <List.Item>
                  All write operations require token validation.
                </List.Item>
              </List.Root>
            </VStack>
          </Box>

          <Box
            width="100%"
            p={6}
            borderRadius="lg"
            bg={sectionBg}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="start" gap={4}>
              <Box display="flex" alignItems="center" width="100%">
                <Icon as={Database} mr={3} boxSize={6} color="orange.500" />
                <Heading size="md">Data Retention & Deletion</Heading>
              </Box>

              <List.Root gap={2} pl={10}>
                <List.Item>
                  You can delete any of your recipes or your profile image at
                  any time.
                </List.Item>
                <List.Item>
                  Deleting your Firebase account will automatically remove your
                  private data from Firestore.
                </List.Item>
              </List.Root>
            </VStack>
          </Box>

          <Box
            width="100%"
            p={6}
            borderRadius="lg"
            bg={sectionBg}
            borderWidth="1px"
            borderColor={borderColor}
            shadow="md"
          >
            <VStack align="start" gap={4}>
              <Box display="flex" alignItems="center" width="100%">
                <Icon as={Mail} mr={3} boxSize={6} color="teal.500" />
                <Heading size="md">Contact</Heading>
              </Box>

              <Text pl={10}>
                If you have privacy concerns or requests, please reach out via
                the contact details in the repository or open an issue.
              </Text>
            </VStack>
          </Box>

          <StackSeparator my={4} />

          <Text
            fontSize="sm"
            color="gray.600"
            _dark={{ color: "gray.400" }}
            pl={2}
          >
            This policy may evolve as the app grows. Any significant changes
            will be documented in the changelog.
          </Text>
        </VStack>
      </Container>

      <Footer />
    </Box>
  );
}
