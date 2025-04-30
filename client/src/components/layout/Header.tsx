"use client";

import {
  Box,
  Flex,
  Heading,
  Spacer,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useHasMounted } from "@/hooks/useHasMounted";
import Logo from "@/components/ui/Logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function Header() {
  const hasMounted = useHasMounted();
  const Router = useRouter();
  const handleHomeClick = () => {
    Router.push("/");
  };
  //check if the user is authenticated
  const { user, authChecked } = useAuth();
  const isAuthenticated = !!user;

  const saveColorModeToFirestore = async (isDark: boolean) => {
    const user = auth.currentUser;
    if (!user) return;

    const settingsRef = doc(db, "users", user.uid, "private", "settings");
    await setDoc(settingsRef, { darkMode: isDark }, { merge: true });
  };
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
        {authChecked && !isAuthenticated && (
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
