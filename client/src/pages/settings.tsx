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
  Avatar,
} from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LuChevronLeft, LuCheck } from "react-icons/lu";
import { FiMail, FiLock, FiUser, FiLogOut } from "react-icons/fi";
import type { UserSettings } from "@/types/user";
import { toaster, Toaster } from "@/components/ui/toaster";
import Head from "next/head";

export default function SettingsPage() {
  const { user, authChecked } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserSettings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showNameSuccess, setShowNameSuccess] = useState(false);
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
        const publicRef = doc(db, "users", user.uid, "public", "profile");
        const privateRef = doc(db, "users", user.uid, "private", "settings");

        const [publicSnap, privateSnap] = await Promise.all([
          getDoc(publicRef),
          getDoc(privateRef),
        ]);

        const publicData = publicSnap.exists() ? publicSnap.data() : {};
        const privateData = privateSnap.exists() ? privateSnap.data() : {};

        // If missing, initialize public profile with default values
        if (!publicSnap.exists()) {
          await setDoc(publicRef, {
            displayName: user.displayName ?? "",
            photoURL: user.photoURL ?? null,
            bio: "",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            recipesPublished: 0,
          });
        }

        // If missing, initialize private settings with default values
        if (!privateSnap.exists()) {
          await setDoc(privateRef, {
            email: user.email ?? "",
            updatedAt: serverTimestamp(),
          });
        }

        setProfile({
          uid: user.uid,
          displayName: publicData.displayName ?? "",
          email: privateData.email ?? "",
          photoURL: publicData.photoURL ?? null,
          recipesPublished: publicData.recipesPublished ?? 0,
          bio: publicData.bio ?? "",
          createdAt: publicData.createdAt,
          updatedAt: publicData.updatedAt ?? privateData.updatedAt,
        });
        setDisplayName(publicData.displayName ?? "");
        setEmail(privateData.email ?? "");
      };

      fetchUserSettings();
    }
  }, [authChecked, user, router]);

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
  const handleUpdateEmail = async () => {
    if (!user || !email.trim()) return;

    try {
      setUpdatingEmail(true);
      await updateEmail(user, email);
      const ref = doc(db, "users", user.uid, "private", "settings");
      await setDoc(
        ref,
        {
          email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfile((prev) => (prev ? { ...prev, email } : null));

      // Show success state
      setShowEmailSuccess(true);
      setTimeout(() => setShowEmailSuccess(false), 2000);

      toaster.create({
        title: "Email updated",
        description: "Your email has been saved successfully.",
        type: "success",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } catch (err: any) {
      console.error("Failed to update email:", err);
      let message = "There was an error updating your email.";
      if (err.code === "auth/invalid-email") {
        message = "Invalid email format.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "Email already in use. Please use a different email.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection.";
      }

      toaster.create({
        title: "Update failed",
        description: message,
        type: "error",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Ensure user is authenticated
    if (!user) {
      toaster.create({
        title: "Authentication error",
        description: "You must be logged in to change your password.",
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    // Check for empty password
    if (!password.trim() || !confirmPassword.trim()) {
      toaster.create({
        title: "Missing fields",
        description: "Please enter and confirm your new password.",
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      toaster.create({
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    try {
      setUpdatingPassword(true); // Set loading state

      // Attempt to update password using Firebase Auth
      const credential = EmailAuthProvider.credential(
        user.email ?? "",
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, password);

      // Update 'updatedAt' timestamp in Firestore
      const privateRef = doc(db, "users", user.uid, "private", "settings");
      await setDoc(
        privateRef,
        { updatedAt: serverTimestamp() },
        { merge: true }
      );

      // Clear inputs and show success feedback
      setPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 2000);

      toaster.create({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        type: "success",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } catch (err: any) {
      console.error("Failed to update password:", err);

      let message = "There was an error updating your password.";

      // Provide detailed feedback based on Firebase error code
      if (err.code === "auth/weak-password") {
        message = "Password must be stronger (e.g., at least 6 characters).";
      } else if (err.code === "auth/invalid-credential") {
        message = "Current password is incorrect.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection.";
      }

      toaster.create({
        title: "Update failed",
        description: message,
        type: "error",
        duration: 4000,
        meta: { closable: true },
        position: "top",
      });
    } finally {
      setUpdatingPassword(false); // Reset loading state
    }
  };

  const handleUpdateName = async () => {
    if (!user || !displayName.trim()) return;

    try {
      setUpdatingUsername(true);

      // Update public profile
      const publicRef = doc(db, "users", user.uid, "public", "profile");
      await setDoc(
        publicRef,
        {
          displayName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfile((prev) => (prev ? { ...prev, displayName } : null));

      setShowNameSuccess(true);
      setTimeout(() => setShowNameSuccess(false), 2000);

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
      setUpdatingUsername(false);
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
      <Head>
        <title>Settings - RecipeKeeper</title>
        <meta
          name="description"
          content="Manage your account preferences, profile info, and privacy settings."
        />
        <meta name="robots" content="noindex" />
      </Head>
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
            <Avatar.Root size="2xl" colorPalette="teal" variant={"solid"}>
              <Avatar.Fallback
                name={profile?.displayName || user.email || "U"}
              />
              <Avatar.Image
                src={profile?.photoURL || user.photoURL || ""}
                alt="User Avatar"
                borderRadius="full"
              />
            </Avatar.Root>

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
                  minW={"150px"}
                  colorScheme="teal"
                  onClick={handleUpdateName}
                  loading={updatingUsername}
                  loadingText="Saving..."
                  size="md"
                >
                  {showNameSuccess ? <LuCheck /> : "Save Name"}
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
                  placeholder="New email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  borderWidth="1px"
                  borderColor={borderColor}
                  css={{ "--focus-color": "teal.400" }}
                />
                <Button
                  minW={"150px"}
                  colorScheme="teal"
                  loadingText="Updating..."
                  size="md"
                  loading={updatingEmail}
                  onClick={handleUpdateEmail}
                >
                  {showEmailSuccess ? <LuCheck /> : "Update Email"}
                </Button>
              </Flex>
            </Box>

            <Box w="full">
              <HStack mb={4} align="center">
                <Icon as={FiLock} color="teal.500" />
                <Text fontWeight="medium">Change Password</Text>
              </HStack>

              <VStack gap={3} align="stretch">
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  borderWidth="1px"
                  borderColor={borderColor}
                  css={{ "--focus-color": "teal.400" }}
                />
                <Flex gap={3}>
                  <Input
                    flex="1"
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderWidth="1px"
                    borderColor={borderColor}
                    css={{ "--focus-color": "teal.400" }}
                  />
                  <Input
                    flex="1"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    borderWidth="1px"
                    borderColor={borderColor}
                    css={{ "--focus-color": "teal.400" }}
                  />
                  <Button
                    minW={"150px"}
                    colorScheme="teal"
                    onClick={handleUpdatePassword}
                    loading={updatingPassword}
                    loadingText="Changing..."
                    size="md"
                  >
                    {showPasswordSuccess ? <LuCheck /> : "Update Password"}
                  </Button>
                </Flex>
              </VStack>
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
