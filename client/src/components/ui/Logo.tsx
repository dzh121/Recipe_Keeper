import { Box } from "@chakra-ui/react";
import Image from "next/image";

export default function Logo() {
  return (
    <Box position="relative" width="48px" height="48px">
      <Image
        src="/logo.png"
        alt="RecipeKeeper logo"
        fill
        sizes="(max-width: 768px) 32px, 48px"
        style={{ objectFit: "contain" }}
        priority
      />
    </Box>
  );
}
