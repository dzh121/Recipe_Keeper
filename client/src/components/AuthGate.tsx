"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { VStack, Spinner, Text } from "@chakra-ui/react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    const isStartPage = router.pathname === "/start";

    if (user) {
      if (isStartPage) router.replace("/");
      setChecked(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && !isStartPage) {
        router.replace("/start");
      } else if (firebaseUser && isStartPage) {
        router.replace("/");
      }
      setChecked(true);
    });

    return () => unsubscribe();
  }, [router]);

  if (!checked) {
    return (
      <VStack minH="100vh" justify="center">
        <Spinner
          size="xl"
          color="teal.500"
          borderWidth="4px"
          animationDuration="0.65s"
        />
        <Text fontSize="md" color="gray.600" _dark={{ color: "gray.400" }}>
          Checking authentication…
        </Text>
      </VStack>
    );
  }

  return <>{children}</>;
}
