"use client";

import Image from "next/image";
import { Box } from "@chakra-ui/react";

export default function Logo() {
  return (
    <Box>
      <Image
        src="/logo.png"
        alt="RecipeKeeper logo"
        width={48}
        height={48}
        priority
      />
    </Box>
  );
}
