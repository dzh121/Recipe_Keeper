"use client";

import { Box, Flex, Heading, Spacer, Avatar, Button } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useHasMounted } from "@/hooks/useHasMounted";
import Logo from "@/components/ui/Logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { UserSettings } from "@/lib/types/user";
import { db } from "@/lib/firebase";

export default function Header() {
  const hasMounted = useHasMounted();
  const Router = useRouter();
  const [profile, setProfile] = useState<UserSettings | null>(null);

  const handleHomeClick = () => {
    Router.push("/");
  };
  //check if the user is authenticated
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && authChecked) {
        const profileRef = doc(db, "users", user.uid, "public", "profile");
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setProfile(snap.data() as UserSettings);
        }
      }
    };

    fetchProfile();
  }, [authChecked, user]);

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
          <Heading fontSize="lg" fontWeight="semibold">
            RecipeKeeper
          </Heading>
        </Button>

        <Spacer />

        {hasMounted && <ColorModeButton mr={3} />}
        {authChecked && isAuthenticated ? (
          <Box ml={2} cursor="pointer" onClick={() => Router.push("/settings")}>
            <Avatar.Root colorPalette="teal" variant="solid" size="sm">
              <Avatar.Fallback
                name={profile?.displayName || user.email || "U"}
              />
              <Avatar.Image
                src={profile?.photoURL || user.photoURL || ""}
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
            Sign Up
          </Button>
        )}
      </Flex>
    </Box>
  );
}
