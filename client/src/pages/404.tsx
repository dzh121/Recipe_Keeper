"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import { useRouter } from "next/router";
import Link from "next/link";
import { useHasMounted } from "@/hooks/useHasMounted";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Head from "next/head";

export default function NotFoundPage() {
  const router = useRouter();

  // Color mode values
  const hasMounted = useHasMounted();

  const svgColors = {
    bgBox: useColorModeValue("#E2E8F0", "#2D3748"),
    bar: useColorModeValue("#4FD1C5", "#319795"),
    text: useColorModeValue("#2D3748", "#CBD5E0"),
    circle: useColorModeValue("#FED7D7", "#63171B"),
    xStroke: useColorModeValue("#E53E3E", "#FC8181"),
  };

  const textColor = useColorModeValue("gray.800", "gray.100");

  const goBack = () => {
    router.back();
  };

  if (!hasMounted) {
    return null; // Prevent rendering on the server side
  }
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
        <title>404 - Page Not Found</title>
        <meta name="description" content="Page not found" />
        <meta name="robots" content="noindex" />
        <meta name="prerender-status-code" content="404" />
      </Head>
      <Header />
      <Container maxW="container.lg">
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="center"
          minH="80vh"
          gap={{ base: 8, md: 10 }}
        >
          {/* Left side - Illustration */}
          <Box flex={1} textAlign="center">
            <Box
              maxW={{ base: "300px", md: "400px" }}
              mx="auto"
              position="relative"
            >
              {/* SVG illustration */}
              <svg
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M297.429 140H159.571C155.462 140 152.143 143.319 152.143 147.429V278.571C152.143 282.681 155.462 286 159.571 286H297.429C301.538 286 304.857 282.681 304.857 278.571V147.429C304.857 143.319 301.538 140 297.429 140Z"
                  fill={svgColors.bgBox}
                />
                <path
                  d="M175.333 220H153.333C150.388 220 148 222.388 148 225.333V308.667C148 311.612 150.388 314 153.333 314H175.333C178.279 314 180.667 311.612 180.667 308.667V225.333C180.667 222.388 178.279 220 175.333 220Z"
                  fill={svgColors.bar}
                />
                <path
                  d="M228.5 201H194.5C191.462 201 189 203.462 189 206.5V308.5C189 311.538 191.462 314 194.5 314H228.5C231.538 314 234 311.538 234 308.5V206.5C234 203.462 231.538 201 228.5 201Z"
                  fill={svgColors.bar}
                />
                <path
                  d="M281.5 178H247.5C244.462 178 242 180.462 242 183.5V308.5C242 311.538 244.462 314 247.5 314H281.5C284.538 314 287 311.538 287 308.5V183.5C287 180.462 284.538 178 281.5 178Z"
                  fill={svgColors.bar}
                />
                <path
                  d="M334.5 157H300.5C297.462 157 295 159.462 295 162.5V308.5C295 311.538 297.462 314 300.5 314H334.5C337.538 314 340 311.538 340 308.5V162.5C340 159.462 337.538 157 334.5 157Z"
                  fill={svgColors.bar}
                />
                <text
                  x="225"
                  y="380"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={svgColors.text}
                  fontWeight="bold"
                  fontSize="120"
                >
                  404
                </text>
                <circle
                  cx="225"
                  cy="120"
                  r="70"
                  fill={svgColors.circle}
                  fillOpacity="0.6"
                />
                <path
                  d="M245 100L205 140M205 100L245 140"
                  stroke={svgColors.xStroke}
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
            </Box>
          </Box>

          {/* Right side - Content */}
          <VStack
            flex={1}
            gap={6}
            align={{ base: "center", md: "flex-start" }}
            textAlign={{ base: "center", md: "left" }}
          >
            <VStack gap={3} align={{ base: "center", md: "flex-start" }}>
              <Heading
                as="h1"
                size="3xl"
                color={textColor}
                fontWeight="extrabold"
              >
                Oops!
              </Heading>
              <Heading
                as="h2"
                size="lg"
                color={textColor}
                fontWeight="semibold"
              >
                Page Not Found
              </Heading>
              <Text fontSize="lg" color="gray.500" maxW="450px">
                We can&apos;t seem to find the page you&apos;re looking for. It
                might have been removed, renamed, or didn&apos;t exist in the
                first place.
              </Text>
            </VStack>

            {/* Navigation options */}
            <HStack gap={4} pt={4}>
              <Button
                onClick={goBack}
                variant="outline"
                colorPalette="gray"
                size="lg"
                borderRadius="lg"
              >
                <FiArrowLeft />
                Go Back
              </Button>
              <Link href="/" passHref>
                <Button colorPalette="teal" size="lg" borderRadius="lg">
                  <FiHome />
                  Go Home
                </Button>
              </Link>
            </HStack>
          </VStack>
        </Flex>
      </Container>
      <Footer />
    </Box>
  );
}
