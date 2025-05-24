"use client";

import {
  Box,
  Flex,
  Heading,
  Spacer,
  Avatar,
  Button,
  HStack,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useHasMounted } from "@/hooks/useHasMounted";
import Logo from "@/components/ui/Logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { UserSettings } from "@/lib/types/user";
import { db } from "@/lib/firebase";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function Header() {
  const hasMounted = useHasMounted();
  const Router = useRouter();
  const [profile, setProfile] = useState<UserSettings | null>(null);
  const { t } = useTranslation();

  const handleHomeClick = () => {
    Router.push("/");
  };
  //check if the user is authenticated
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !authChecked) return;

      const cached = localStorage.getItem("userProfileWithExpiry");

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();

          // Cache is valid for 12 hours (43_200_000 ms)
          if (now - timestamp < 43_200_000) {
            setProfile(data);
            return;
          } else {
            localStorage.removeItem("userProfileWithExpiry"); // Expired
          }
        } catch {
          localStorage.removeItem("userProfileWithExpiry"); // Corrupted
        }
      }

      // Fetch fresh data from Firestore
      try {
        const profileRef = doc(db, "users", user.uid, "public", "profile");
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const freshProfile = snap.data() as UserSettings;
          setProfile(freshProfile);
          localStorage.setItem(
            "userProfileWithExpiry",
            JSON.stringify({
              data: freshProfile,
              timestamp: Date.now(),
            })
          );
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [authChecked, user]);

  if (!hasMounted) return null;
  return (
    <Box
      as="header"
      py={4}
      px={6}
      borderBottom="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700" }}
    >
      <Flex align="center">
        <Button variant="ghost" onClick={handleHomeClick}>
          <Logo />
          <Heading
            fontSize="lg"
            fontWeight="semibold"
            display={{ base: "none", md: "inline" }}
          >
            {hasMounted ? t("app.title") : "Recipe Keeper"}
          </Heading>
        </Button>

        <Spacer />
        <HStack gap={4}>
          {hasMounted && <ColorModeButton mr={3} />}
          <LanguageSwitcher />
          {authChecked && isAuthenticated ? (
            <Box
              ml={2}
              cursor="pointer"
              onClick={() => Router.push("/settings")}
            >
              <Avatar.Root colorPalette="teal" variant="solid" size="sm">
                <Avatar.Fallback
                  name={profile?.displayName || user.email || "U"}
                />
                <Avatar.Image
                  src={profile?.photoURL || user.photoURL || undefined}
                  alt="User Avatar"
                  borderRadius="full"
                />
              </Avatar.Root>
            </Box>
          ) : (
            <Button
              colorPalette="teal"
              variant="solid"
              onClick={() => Router.push("/signin")}
            >
              {hasMounted ? t("header.signin") : "Sign In"}
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}
