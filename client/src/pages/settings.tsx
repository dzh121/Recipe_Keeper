"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Spinner,
  Stack,
  Input,
  Container,
  HStack,
  Icon,
  InputGroup,
  StackSeparator,
  Flex,
} from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LuChevronLeft, LuCheck } from "react-icons/lu";
import { FiMail, FiLock, FiUser, FiLogOut } from "react-icons/fi";
import type { UserSettings } from "@/types/user";
import { toaster, Toaster } from "@/components/ui/toaster";

export default function SettingsPage() {
  const { user, authChecked } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserSettings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { colorMode } = useColorMode();

  const bgColor = colorMode === "light" ? "white" : "gray.800";
  const borderColor = colorMode === "light" ? "gray.200" : "gray.700";

  // Redirect or fetch user profile from Firestore
  useEffect(() => {
    if (authChecked && !user) {
      router.replace("/signin");
      return;
    }

    if (user && authChecked) {
      const fetchUserSettings = async () => {
        const ref = doc(db, "users", user.uid);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          // User settings exist, update state
          const data = snapshot.data() as UserSettings;
          setProfile(data);
          setDisplayName(data.displayName);
        } else {
          // User settings do not exist, create new settings
          const newData = {
            uid: user.uid,
            email: user.email ?? "",
            displayName: user.displayName ?? "",
            photoURL: user.photoURL ?? null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(ref, newData);

          // Safe cast: serverTimestamp() will be replaced by Firestore later
          setProfile(newData as unknown as UserSettings);
          setDisplayName(newData.displayName);
        }
      };

      fetchUserSettings();
    }
  }, [authChecked, user, router]);

  useEffect(() => {
    console.log("Profile updated:", profile);
  }, [profile]);

  if (!authChecked || !user) {
    return (
      <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="xl" borderWidth="4px" color="teal.500" />
      </Box>
    );
  }

  const handleUpdateName = async () => {
    if (!user || !displayName.trim()) return;

    try {
      setUpdating(true);
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          displayName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfile((prev) => (prev ? { ...prev, displayName } : null));

      // Show success state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      toaster.create({
        title: "Profile updated",
        description: "Your display name has been saved successfully.",
        type: "success",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } catch (err) {
      console.error("Failed to update name:", err);
      toaster.create({
        title: "Update failed",
        description:
          "There was an error updating your profile. Please try again.",
        type: "error",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Box
      minH="100vh"
      bg={colorMode === "light" ? "gray.50" : "gray.900"}
      color={colorMode === "light" ? "gray.800" : "white"}
      display="flex"
      flexDirection="column"
    >
      <Toaster />
      <Header />

      <Container maxW="container.md" py={8} flex={1}>
        <Button variant="ghost" mb={6} onClick={handleGoBack} size="md">
          <LuChevronLeft />
          Go Back
        </Button>

        <VStack
          gap={8}
          align="start"
          w="full"
          bg={bgColor}
          p={8}
          borderRadius="lg"
          boxShadow="md"
          border="1px"
          borderColor={borderColor}
        >
          <Heading fontSize="2xl">Account Settings</Heading>

          <Stack
            direction={{ base: "column", md: "row" }}
            gap={6}
            align="center"
            w="full"
            bg={colorMode === "light" ? "gray.50" : "gray.700"}
            p={6}
            borderRadius="md"
          >
            <Box
              bg="teal.500"
              color="white"
              borderRadius="full"
              w="80px"
              h="80px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              fontWeight="bold"
              boxShadow="md"
            >
              {(profile?.displayName || user.email || "U")
                .charAt(0)
                .toUpperCase()}
            </Box>
            <Box flex={1}>
              <Text fontWeight="bold" fontSize="lg">
                {profile?.displayName || "No display name set"}
              </Text>
              <Text color={colorMode === "light" ? "gray.600" : "gray.300"}>
                {profile?.email}
              </Text>
              <Text
                color={colorMode === "light" ? "gray.500" : "gray.400"}
                fontSize="sm"
                mt={1}
              >
                Member since {profile?.createdAt?.toDate().toLocaleDateString()}
              </Text>
            </Box>
          </Stack>

          <StackSeparator />

          <VStack gap={6} w="full">
            <Box w="full">
              <HStack mb={2}>
                <Icon as={FiUser} color="teal.500" />
                <Text fontWeight="medium">Display Name</Text>
              </HStack>
              <Flex>
                <InputGroup flex="1" mr={3}>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    size="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    css={{ "--focus-color": "teal.400" }}
                  />
                </InputGroup>
                <Button
                  colorScheme="teal"
                  onClick={handleUpdateName}
                  loading={updating}
                  loadingText="Saving..."
                  size="md"
                >
                  {showSuccess ? <LuCheck /> : "Save Name"}
                </Button>
              </Flex>
            </Box>

            <Box w="full">
              <HStack mb={2}>
                <Icon as={FiMail} color="teal.500" />
                <Text fontWeight="medium">Change Email</Text>
              </HStack>
              <Flex>
                <Input
                  flex="1"
                  mr={3}
                  placeholder="New email (coming soon)"
                  disabled
                  borderWidth="1px"
                  borderColor={borderColor}
                  css={{ "--focus-color": "teal.400" }}
                  _disabled={{ opacity: 0.7, cursor: "not-allowed" }}
                />
                <Button
                  colorScheme="teal"
                  disabled
                  opacity={0.5}
                  cursor="not-allowed"
                >
                  Update Email
                </Button>
              </Flex>
            </Box>

            <Box w="full">
              <HStack mb={2}>
                <Icon as={FiLock} color="teal.500" />
                <Text fontWeight="medium">Change Password</Text>
              </HStack>
              <Flex>
                <Input
                  flex="1"
                  mr={3}
                  placeholder="New password (coming soon)"
                  type="password"
                  disabled
                  borderWidth="1px"
                  borderColor={borderColor}
                  css={{ "--focus-color": "teal.400" }}
                  _disabled={{ opacity: 0.7, cursor: "not-allowed" }}
                />
                <Button
                  colorScheme="teal"
                  disabled
                  opacity={0.5}
                  cursor="not-allowed"
                >
                  Update Password
                </Button>
              </Flex>
            </Box>

            <StackSeparator my={4} />

            <Button
              w="full"
              colorScheme="red"
              variant="outline"
              size="lg"
              onClick={async () => {
                await signOut(auth);
                toaster.create({
                  title: "Signed out",
                  description: "You have been successfully logged out.",
                  type: "info",
                  duration: 3000,
                  meta: { closable: true },
                });
                router.replace("/signin");
              }}
            >
              <FiLogOut />
              Log Out
            </Button>
          </VStack>
        </VStack>
      </Container>

      <Footer />
    </Box>
  );
}
