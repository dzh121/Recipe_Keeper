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
  Progress,
  IconButton,
  Slider,
  Switch,
  Textarea,
} from "@chakra-ui/react";
import { useColorMode } from "@/components/ui/color-mode";
import { use, useEffect, useState } from "react";
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
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LuChevronLeft, LuCheck } from "react-icons/lu";
import {
  FiMail,
  FiLock,
  FiUser,
  FiLogOut,
  FiCamera,
  FiTrash2,
} from "react-icons/fi";
import type { UserSettings } from "@/lib/types/user";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { toaster, Toaster } from "@/components/ui/toaster";
import Head from "next/head";
import { getCroppedImg } from "@/utils/cropImage";
import BackButton from "@/components/ui/back";
import { useTranslation } from "react-i18next";
import { createSlug } from "@/lib/utils/slug";

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
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const { colorMode } = useColorMode();
  const { t, i18n } = useTranslation();
  const [defaultKosher, setDefaultKosher] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("defaultKosher");
    return stored ? JSON.parse(stored) : false;
  });

  const [defaultPublic, setDefaultPublic] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("defaultPublic");
    return stored ? JSON.parse(stored) : true;
  });

  const bgColor = colorMode === "light" ? "white" : "gray.800";
  const borderColor = colorMode === "light" ? "gray.200" : "gray.700";

  useEffect(() => {
    localStorage.setItem("defaultKosher", JSON.stringify(defaultKosher));
  }, [defaultKosher]);

  useEffect(() => {
    localStorage.setItem("defaultPublic", JSON.stringify(defaultPublic));
  }, [defaultPublic]);

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
          slug: publicData.slug ?? "",
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
        title: t("settings.toasts.emailUpdated"),
        description: t("settings.success.email"),
        type: "success",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } catch (err: any) {
      console.error("Failed to update email:", err);
      let message = t("settings.errors.emailError");
      if (err.code === "auth/invalid-email") {
        message = t("settings.errors.invalidEmail");
      } else if (err.code === "auth/email-already-in-use") {
        message = t("settings.errors.emailInUse");
      } else if (err.code === "auth/network-request-failed") {
        message = t("settings.errors.network");
      }

      toaster.create({
        title: t("settings.errors.update"),
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
        title: t("settings.errors.authError"),
        description: t("settings.errors.auth"),
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    // Check for empty password
    if (!password.trim() || !confirmPassword.trim()) {
      toaster.create({
        title: t("settings.errors.missingField"),
        description: t("settings.errors.missingPassword"),
        type: "error",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      toaster.create({
        title: t("settings.errors.missingField"),
        description: t("settings.errors.mismatch"),
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
        title: t("settings.toasts.passwordUpdated"),
        description: t("settings.errors.passwordUpdatedDesc"),
        type: "success",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } catch (err: any) {
      console.error("Failed to update password:", err);

      let message = t("settings.errors.password");

      // Provide detailed feedback based on Firebase error code
      if (err.code === "auth/weak-password") {
        message = t("settings.errors.weakPassword");
      } else if (err.code === "auth/invalid-credential") {
        message = t("settings.errors.invalidCredential");
      } else if (err.code === "auth/network-request-failed") {
        message = t("settings.errors.network");
      }

      toaster.create({
        title: t("settings.toasts.updateFailed"),
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
      localStorage.removeItem("userProfileWithExpiry");

      // Update public profile
      const publicRef = doc(db, "users", user.uid, "public", "profile");
      const slug = createSlug(displayName);

      if (profile?.slug && profile?.slug !== slug) {
        const oldSlugRef = doc(db, "slugs", profile?.slug);
        await deleteDoc(oldSlugRef);
      }

      await setDoc(
        publicRef,
        {
          displayName,
          slug: slug,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const newSlugRef = doc(db, "slugs", slug);
      await setDoc(
        newSlugRef,
        {
          uid: user.uid,
        },
        { merge: true }
      );

      setProfile((prev) => (prev ? { ...prev, displayName, slug } : null));

      setShowNameSuccess(true);
      setTimeout(() => setShowNameSuccess(false), 2000);

      toaster.create({
        title: t("settings.toasts.nameUpdated"),
        description: t("settings.toasts.nameUpdatedDesc"),
        type: "success",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } catch (err) {
      console.error("Failed to update name:", err);
      toaster.create({
        title: t("settings.toasts.updateFailed"),
        description: t("settings.toasts.updateFailedDesc"),
        type: "error",
        duration: 3000,
        meta: { closable: true },
        position: "top",
      });
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    setIsUploading(true);

    const token = await user.getIdToken(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/remove-photo?uid=${user.uid}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setLocalPhotoURL(null);
        setProfile((prev) => (prev ? { ...prev, photoURL: null } : null));
      } else {
        const data = await res.json();
        console.error(data.error);
        toaster.create({
          title: t("settings.toasts.removeFailed"),
          description: t("settings.toasts.removeFailedDesc"),
          type: "error",
          duration: 3000,
          meta: { closable: true },
          position: "top",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
  };

  const handleCropDone = async () => {
    if (!selectedImage || !croppedAreaPixels || !user) return;
    localStorage.removeItem("userProfileWithExpiry");

    const croppedBlob = await getCroppedImg(
      URL.createObjectURL(selectedImage),
      croppedAreaPixels
    );

    const formData = new FormData();
    const croppedFile = new File([croppedBlob], "cropped.jpg", {
      type: "image/jpeg",
    });

    formData.append("file", croppedFile);
    formData.append("uid", user.uid);

    setCropModalOpen(false);
    setIsUploading(true);
    setUploadProgress(0);

    const token = await user.getIdToken(true);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `${process.env.NEXT_PUBLIC_API_URL}/profile/upload-photo`,
        true
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const newPhotoURL = `${data.photoURL}`;

          setLocalPhotoURL(newPhotoURL);
          setProfile((prev) =>
            prev ? { ...prev, photoURL: newPhotoURL } : null
          );
        } else {
          const errorData = JSON.parse(xhr.responseText);
          console.error("Error:", errorData.error);
        }
        setIsUploading(false);
        setSelectedImage(null);
      };

      xhr.onerror = () => {
        console.error("Upload error");
        setIsUploading(false);
        setSelectedImage(null);
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setSelectedImage(null);
    }
  };

  const marks = [
    { value: 1, label: "1X" },
    { value: 2, label: "2X" },
    { value: 3, label: "3X" },
  ];
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
        <title>Settings - Recipe Keeper</title>
        <meta
          name="description"
          content="Manage your account preferences, profile info, and privacy settings."
        />
        <meta name="robots" content="noindex" />
      </Head>
      <Toaster />
      <Header />

      <Container maxW="container.md" py={8} flex={1}>
        <BackButton />
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
          <Heading fontSize="2xl">{t("settings.title")}</Heading>

          <Stack
            direction={{ base: "column", md: "row" }}
            gap={6}
            align="center"
            w="full"
            bg={colorMode === "light" ? "gray.50" : "gray.700"}
            p={6}
            borderRadius="md"
          >
            <Box position="relative" pt={2} pb={6}>
              <Box
                cursor="pointer"
                onClick={() => {
                  if (profile?.slug) {
                    router.push(`/user/${profile.slug}`);
                  }
                }}
              >
                <Avatar.Root
                  colorPalette="teal"
                  variant="solid"
                  style={{ width: "150px", height: "150px" }}
                >
                  <Avatar.Fallback
                    name={profile?.displayName || user.email || "U"}
                  />
                  <Avatar.Image
                    src={
                      localPhotoURL ||
                      profile?.photoURL ||
                      user.photoURL ||
                      undefined
                    }
                    alt="User Avatar"
                    borderRadius="full"
                  />
                </Avatar.Root>
              </Box>

              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                display="none"
                id="profilePicUpload"
              />

              {/* Controls positioned completely below the avatar */}
              <Flex
                position="absolute"
                bottom="-8px"
                left="0"
                right="0"
                width="100%"
                justifyContent="center"
                gap={3}
              >
                <label htmlFor="profilePicUpload">
                  <IconButton
                    as="span"
                    aria-label="Upload photo"
                    colorPalette="teal"
                    variant="solid"
                    size="sm"
                    rounded="full"
                    boxShadow="md"
                    _hover={{ transform: "scale(1.05)" }}
                    transition="all 0.2s"
                  >
                    <FiCamera />
                  </IconButton>
                </label>

                {(localPhotoURL || profile?.photoURL || user.photoURL) && (
                  <IconButton
                    aria-label="Remove photo"
                    colorPalette="red"
                    variant="solid"
                    size="sm"
                    rounded="full"
                    boxShadow="md"
                    onClick={handleRemovePhoto}
                    _hover={{ transform: "scale(1.05)" }}
                    transition="all 0.2s"
                  >
                    <FiTrash2 />
                  </IconButton>
                )}
              </Flex>

              {/* Upload progress indicator */}
              {isUploading && (
                <Box
                  position="absolute"
                  bottom="-20px"
                  left="0"
                  right="0"
                  width="100%"
                >
                  <Progress.Root
                    size="xs"
                    colorPalette="teal"
                    value={uploadProgress}
                    borderRadius="full"
                    w="full"
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                </Box>
              )}
            </Box>

            <Box flex={1}>
              <Text fontWeight="bold" fontSize="lg">
                {profile?.displayName || t("settings.noDisplayName")}
              </Text>
              <Text color={colorMode === "light" ? "gray.600" : "gray.300"}>
                {profile?.email}
              </Text>
              <Text
                color={colorMode === "light" ? "gray.500" : "gray.400"}
                fontSize="sm"
                mt={1}
              >
                {t("settings.memberSince")}{" "}
                {profile?.createdAt?.toDate().toLocaleDateString()}
              </Text>
            </Box>
          </Stack>

          <StackSeparator />

          <VStack gap={6} w="full">
            <Box w="full">
              <HStack mb={2}>
                <Icon as={FiUser} color="teal.500" />
                <Text fontWeight="medium">{t("settings.name")}</Text>
              </HStack>
              <Flex gap={3} direction={{ base: "column", md: "row" }}>
                <InputGroup>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("settings.namePlaceholder")}
                    size="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </InputGroup>
                <Button
                  minW={"150px"}
                  colorPalette="teal"
                  onClick={handleUpdateName}
                  loading={updatingUsername}
                  loadingText={t("settings.saving")}
                  size="md"
                >
                  {showNameSuccess ? <LuCheck /> : t("settings.saveName")}
                </Button>
              </Flex>
            </Box>

            <Box w="full">
              <HStack mb={2}>
                <Icon as={FiMail} color="teal.500" />
                <Text fontWeight="medium">{t("settings.email")}</Text>
              </HStack>
              <Flex gap={3} direction={{ base: "column", md: "row" }}>
                <Input
                  placeholder={t("settings.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  borderWidth="1px"
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                />
                <Button
                  minW={"150px"}
                  colorPalette="teal"
                  loadingText={t("settings.updating")}
                  size="md"
                  loading={updatingEmail}
                  onClick={handleUpdateEmail}
                >
                  {showEmailSuccess ? <LuCheck /> : t("settings.updateEmail")}
                </Button>
              </Flex>
            </Box>

            <Box w="full">
              <HStack mb={4} align="center">
                <Icon as={FiLock} color="teal.500" />
                <Text fontWeight="medium">{t("settings.password")}</Text>
              </HStack>

              <VStack gap={3} align="stretch">
                <Input
                  type="password"
                  placeholder={t("settings.currentPassword")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  borderWidth="1px"
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                />
                <Flex gap={3} direction={{ base: "column", md: "row" }}>
                  <Input
                    w="100%"
                    type="password"
                    placeholder={t("settings.newPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderWidth="1px"
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                  <Input
                    w="100%"
                    type="password"
                    placeholder={t("settings.confirmPassword")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    borderWidth="1px"
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                  <Button
                    w={{ base: "100%", md: "auto" }}
                    minW={"150px"}
                    colorPalette="teal"
                    onClick={handleUpdatePassword}
                    loading={updatingPassword}
                    loadingText={t("settings.changing")}
                    size="md"
                  >
                    {showPasswordSuccess ? (
                      <LuCheck />
                    ) : (
                      t("settings.updatePassword")
                    )}
                  </Button>
                </Flex>
              </VStack>
            </Box>
            <Box w="full">
              <HStack mb={2}>
                <Icon as={FiUser} color="teal.500" />
                <Text fontWeight="medium">{t("settings.bio")}</Text>
              </HStack>
              <Flex gap={3} direction={{ base: "column", md: "row" }}>
                <InputGroup flex="1">
                  <Textarea
                    value={profile?.bio ?? ""}
                    onChange={(e) =>
                      setProfile((prev) =>
                        prev ? { ...prev, bio: e.target.value } : null
                      )
                    }
                    placeholder={t("settings.bioPlaceholder")}
                    size="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                    rows={4}
                  />
                </InputGroup>
                <Button
                  minW={"150px"}
                  colorPalette="teal"
                  onClick={async () => {
                    if (!user || !profile?.bio) return;
                    await setDoc(
                      doc(db, "users", user.uid, "public", "profile"),
                      {
                        bio: profile.bio,
                        updatedAt: serverTimestamp(),
                      },
                      { merge: true }
                    );
                    toaster.create({
                      title: t("settings.toasts.bioUpdated"),
                      description: t("settings.toasts.bioUpdatedDesc"),
                      type: "success",
                      duration: 3000,
                      meta: { closable: true },
                      position: "top",
                    });
                  }}
                >
                  {t("settings.saveBio")}
                </Button>
              </Flex>
            </Box>

            <Box w="full">
              <HStack mb={2}>
                <Icon as={LuCheck} color="teal.500" />
                <Text fontWeight="medium">{t("settings.preferences")}</Text>
              </HStack>

              <VStack gap={4} align="start" w="full">
                <Switch.Root
                  checked={defaultKosher}
                  onCheckedChange={(e) => setDefaultKosher(e.checked)}
                  size="md"
                  colorPalette="teal"
                >
                  <Switch.HiddenInput />
                  <HStack gap={3}>
                    <Switch.Control
                      bg={defaultKosher ? "teal.500" : "gray.300"}
                      borderRadius="full"
                      flexDirection={
                        i18n.language === "he" ? "row-reverse" : "row"
                      }
                    />
                    <Switch.Label>{t("settings.defaultKosher")}</Switch.Label>
                  </HStack>
                </Switch.Root>

                <Switch.Root
                  checked={defaultPublic}
                  onCheckedChange={(e) => setDefaultPublic(e.checked)}
                  size="md"
                  colorPalette="teal"
                >
                  <Switch.HiddenInput />
                  <HStack gap={3}>
                    <Switch.Control
                      bg={defaultPublic ? "teal.500" : "gray.300"}
                      borderRadius="full"
                      flexDirection={
                        i18n.language === "he" ? "row-reverse" : "row"
                      }
                    />
                    <Switch.Label>{t("settings.defaultPublic")}</Switch.Label>
                  </HStack>
                </Switch.Root>
              </VStack>
            </Box>

            <StackSeparator my={4} />
            <Button
              w="full"
              colorPalette="red"
              variant="outline"
              size="lg"
              onClick={async () => {
                await signOut(auth);
                localStorage.removeItem("userProfileWithExpiry");
                toaster.create({
                  title: t("settings.toasts.signedOut"),
                  description: t("settings.toasts.signedOutDesc"),
                  type: "info",
                  duration: 3000,
                  meta: { closable: true },
                });
                router.replace("/signin");
              }}
            >
              <FiLogOut />
              {t("settings.logout")}
            </Button>
          </VStack>
        </VStack>
      </Container>

      <Footer />
      {cropModalOpen && selectedImage && (
        <Box
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="blackAlpha.800"
          zIndex="9999"
          display="flex"
          justifyContent="center"
          alignItems="center"
          p={4}
        >
          <Box
            bg={bgColor}
            borderRadius="lg"
            maxW="md"
            w="full"
            maxH="90vh"
            overflow="hidden"
            boxShadow="xl"
            borderColor={borderColor}
            borderWidth="1px"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
              <Heading size="sm" textAlign="center">
                {t("settings.cropTitle")}
              </Heading>
            </Box>

            {/* Cropper container with fixed height */}
            <Box position="relative" h="300px" flexShrink={0}>
              {selectedImage && (
                <Cropper
                  image={URL.createObjectURL(selectedImage)}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={(_, croppedPixels) =>
                    setCroppedAreaPixels(croppedPixels)
                  }
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              )}
            </Box>

            {/* Controls */}
            <VStack
              p={4}
              gap={4}
              borderTopWidth="1px"
              borderColor={borderColor}
            >
              <Box w="full">
                <Text fontSize="sm" mb={2}>
                  {t("settings.zoom")}
                </Text>

                <Slider.Root
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(e) => setZoom(e.value[0])}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumbs />
                    <Slider.Marks mt={2} marks={marks} />
                  </Slider.Control>
                </Slider.Root>
              </Box>

              {/* Buttons */}
              <HStack w="full" gap={3}>
                <Button
                  variant="outline"
                  colorPalette="red"
                  flex={1}
                  onClick={() => {
                    setCropModalOpen(false);
                    setSelectedImage(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button colorPalette="teal" flex={1} onClick={handleCropDone}>
                  {t("common.save")}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
