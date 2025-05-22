"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Button,
  Heading,
  Text,
  Input,
  VStack,
  HStack,
  Flex,
  Spinner,
  SimpleGrid,
  Stack,
  createListCollection,
  Select,
  Portal,
  Card,
  CardBody,
  CardHeader,
  Icon,
  InputGroup,
  Tag,
  TagLabel,
  Center,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import {
  LuPlus,
  LuTag,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuSearch,
  LuFilter,
  LuCalendar,
} from "react-icons/lu";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useHasMounted } from "@/hooks/useHasMounted";
import { toaster, Toaster } from "@/components/ui/toaster";
import Head from "next/head";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import BackButton from "@/components/ui/back";
import { Timestamp } from "firebase/firestore";

// Define types
type TagSuggestion = {
  docId: string;
  id: string;
  translations: {
    en: string;
    he: string;
  };
  suggestedBy: string;
  createdAt: any; // Timestamp
  status: "pending" | "approved" | "rejected";
};

export default function TagSuggestionsPage() {
  const hasMounted = useHasMounted();
  const { t, i18n } = useTranslation();

  const { user, authChecked } = useAuth();
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [newTagEn, setNewTagEn] = useState("");
  const [newTagHe, setNewTagHe] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);

  // Chakra UI color mode values
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const highlightColor = useColorModeValue("teal.50", "teal.900");
  const accentColor = useColorModeValue("teal.500", "teal.300");
  const inputBg = useColorModeValue("gray.50", "gray.800");
  const inputBorderColor = useColorModeValue("gray.300", "gray.600");
  const inputFocusBorderColor = useColorModeValue("teal.400", "teal.300");
  const adminBg = useColorModeValue("gray.50", "gray.700");

  const headerBg = useColorModeValue("teal.50", "teal.900");
  const headerTextColor = useColorModeValue("teal.800", "teal.100");
  // Status colors
  const yellowBg = useColorModeValue("yellow.100", "yellow.800");
  const yellowText = useColorModeValue("yellow.800", "yellow.100");
  const greenBg = useColorModeValue("green.100", "green.800");
  const greenText = useColorModeValue("green.800", "green.100");
  const redBg = useColorModeValue("red.100", "red.800");
  const redText = useColorModeValue("red.800", "red.100");

  const statusColors = {
    pending: { bg: yellowBg, color: yellowText, icon: <LuClock /> },
    approved: { bg: greenBg, color: greenText, icon: <LuCircleCheck /> },
    rejected: { bg: redBg, color: redText, icon: <LuCircleX /> },
  };

  const fetchSuggestions = async () => {
    if (!authChecked) return;
    if (!user) {
      setTimeout(() => {
        toaster.create({
          title: t("tagSuggestions.toasts.unauthorized.title"),
          description: t("tagSuggestions.toasts.unauthorized.description"),
          type: "error",
          duration: 5000,
          meta: { closable: true },
        });
      }, 0);
      setIsLoading(false);
      return;
    }

    const authToken = await user.getIdToken();

    try {
      setIsLoading(true);
      const idTokenResult = await user.getIdTokenResult();
      const isAdminValue =
        idTokenResult.claims?.admin === true ||
        idTokenResult.claims?.role === "admin";

      setIsAdmin(isAdminValue);

      const endpoint = isAdminValue
        ? "/tags/suggestions"
        : "/tags/suggestions/user";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tag suggestions");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      setTimeout(() => {
        toaster.create({
          title: t("tagSuggestions.toasts.fetchError.title"),
          description:
            error instanceof Error
              ? error.message
              : t("tagSuggestions.toasts.fetchError.description"),
          type: "error",
          duration: 5000,
          meta: { closable: true },
        });
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  // then use it inside useEffect
  useEffect(() => {
    fetchSuggestions();
  }, [authChecked, user]);

  const handleChangeStatus = async (
    id: string,
    newStatus: "approved" | "rejected"
  ) => {
    if (!user) return;
    const authToken = await user.getIdToken();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tags/suggestions/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      toaster.create({
        title: t("tagSuggestions.toasts.statusChanged.title", "Status updated"),
        description: t(
          "tagSuggestions.toasts.statusChanged.description",
          `Suggestion was marked as ${newStatus}`
        ),
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });

      fetchSuggestions();
    } catch (err) {
      toaster.create({
        title: t("tagSuggestions.toasts.statusError.title", "Update failed"),
        description:
          err instanceof Error
            ? err.message
            : t("tagSuggestions.toasts.statusError.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!newTagEn.trim() && !newTagHe.trim()) {
      toaster.create({
        title: t("tagSuggestions.toasts.emptyFields.title"),
        description: t("tagSuggestions.toasts.emptyFields.description"),
        type: "warning",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    if (
      (newTagEn && newTagEn.length > 50) ||
      (newTagHe && newTagHe.length > 50)
    ) {
      toaster.create({
        title: t("tagSuggestions.toasts.tooLong.title"),
        description: t("tagSuggestions.toasts.tooLong.description"),
        type: "warning",
        duration: 3000,
        meta: { closable: true },
      });
      return;
    }

    if (!user) {
      toaster.create({
        title: t("tagSuggestions.toasts.unauthorized.title"),
        description: t("tagSuggestions.toasts.unauthorized.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
      return;
    }

    const authToken = await user.getIdToken();
    if (!authToken) {
      toaster.create({
        title: t("tagSuggestions.toasts.unauthorized.title"),
        description: t("tagSuggestions.toasts.unauthorized.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tags/suggest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            en: newTagEn.trim() || null,
            he: newTagHe.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit tag suggestion");
      }

      toaster.create({
        title: t("tagSuggestions.toasts.suggestionSubmitted.title"),
        description: t("tagSuggestions.toasts.suggestionSubmitted.description"),
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });

      setNewTagEn("");
      setNewTagHe("");
      fetchSuggestions(); // Refresh the suggestions list
    } catch (error) {
      toaster.create({
        title: t("tagSuggestions.toasts.submitError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("tagSuggestions.toasts.submitError.description"),
        type: "error",
        duration: 5000,
        meta: { closable: true },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormattedDate = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      // 🔧 Fix: rehydrate into a proper Timestamp if needed
      const normalized =
        typeof timestamp.toDate === "function"
          ? timestamp
          : new Timestamp(timestamp._seconds, timestamp._nanoseconds);

      const date = normalized.toDate();

      if (isNaN(date.getTime())) {
        console.warn("Invalid date in tag suggestion:", timestamp);
        return "";
      }

      return new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (err) {
      console.warn("Error formatting date:", err, timestamp);
      return "";
    }
  };

  const filteredSuggestions = suggestions
    .filter((suggestion) => {
      // Status filter
      if (statusFilter !== "all" && suggestion.status !== statusFilter) {
        return false;
      }

      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchText = `${suggestion.translations.en || ""} ${
          suggestion.translations.he || ""
        }`.toLowerCase();
        return matchText.includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by newest first
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

  const statusOptions = createListCollection({
    items: [
      { label: t("tagSuggestions.allStatuses", "All Statuses"), value: "all" },
      { label: t("tagSuggestions.statusPending", "Pending"), value: "pending" },
      {
        label: t("tagSuggestions.statusApproved", "Approved"),
        value: "approved",
      },
      {
        label: t("tagSuggestions.statusRejected", "Rejected"),
        value: "rejected",
      },
    ],
  });

  if (!hasMounted) return null;

  if (!authChecked) {
    return (
      <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="xl" borderWidth="4px" color={accentColor} />
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      color={textColor}
      display="flex"
      flexDirection="column"
    >
      <Head>
        <title>Tag Suggestions | Recipe Keeper</title>
        <meta
          name="description"
          content="Suggest new tags for the recipe collection"
        />
        <meta name="robots" content="noindex" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="Tag Suggestions | RecipeKeeper" />
        <meta
          property="og:description"
          content="Suggest new tags for better recipe organization"
        />
      </Head>

      <Toaster />
      <Header />

      <Container maxW="container.md" py={{ base: 6, md: 10 }} flex="1">
        <Box mb={6}>
          <BackButton />
        </Box>

        <VStack gap={4} align="stretch" mb={8}>
          <Heading size="xl" fontWeight="bold">
            {t("tagSuggestions.title", "Tag Suggestions")}
          </Heading>
          <Text fontSize="lg" color={labelColor}>
            {t(
              "tagSuggestions.description",
              "Suggest new tags to better organize and find recipes. Our team will review your suggestions."
            )}
          </Text>
        </VStack>

        <Card.Root borderRadius="xl" overflow="hidden" boxShadow="md" mb={8}>
          <CardHeader bg={headerBg} py={4}>
            <HStack gap={3}>
              <Icon as={LuPlus} color={accentColor} boxSize={5} />
              <Heading size="md" color={headerTextColor}>
                {t("tagSuggestions.suggestNewTag", "Suggest a New Tag")}
              </Heading>
            </HStack>
          </CardHeader>

          <CardBody>
            <VStack align="stretch" gap={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                <Box>
                  <Text mb={2} fontWeight="medium" color={labelColor}>
                    {t("tagSuggestions.englishLabel", "English")}
                  </Text>
                  <Input
                    placeholder={t(
                      "tagSuggestions.inputEnglish",
                      "Enter tag name in English"
                    )}
                    value={newTagEn}
                    onChange={(e) => setNewTagEn(e.target.value)}
                    borderRadius="md"
                    bg={inputBg}
                    size="lg"
                    borderWidth="1px"
                    borderColor={inputBorderColor}
                    _focus={{
                      borderColor: inputFocusBorderColor,
                      boxShadow: "0 0 0 1px " + inputFocusBorderColor,
                    }}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium" color={labelColor}>
                    {t("tagSuggestions.hebrewLabel", "Hebrew")}
                  </Text>
                  <Input
                    placeholder={t(
                      "tagSuggestions.inputHebrew",
                      "Enter tag name in Hebrew"
                    )}
                    value={newTagHe}
                    onChange={(e) => setNewTagHe(e.target.value)}
                    borderRadius="md"
                    bg={inputBg}
                    size="lg"
                    borderWidth="1px"
                    borderColor={inputBorderColor}
                    _focus={{
                      borderColor: inputFocusBorderColor,
                      boxShadow: "0 0 0 1px " + inputFocusBorderColor,
                    }}
                  />
                </Box>
              </SimpleGrid>

              <Text fontSize="sm" color={mutedText}>
                {t(
                  "tagSuggestions.suggestNote",
                  "Enter the tag in at least one language. Our team will review your suggestion."
                )}
              </Text>

              <Button
                colorPalette="teal"
                size="md"
                onClick={handleSubmitSuggestion}
                loading={isSubmitting}
                loadingText={t("tagSuggestions.submitting", "Submitting...")}
                borderRadius="md"
                px={8}
                height="48px"
                alignSelf="flex-start"
                _hover={{ transform: "translateY(-1px)", boxShadow: "sm" }}
                transition="all 0.2s"
              >
                <LuPlus />
                {t("tagSuggestions.suggestButton", "Submit Suggestion")}
              </Button>
            </VStack>
          </CardBody>
        </Card.Root>

        <Card.Root
          borderRadius="xl"
          overflow="hidden"
          boxShadow="md"
          borderColor={borderColor}
        >
          <CardHeader bg={headerBg} py={4}>
            <Stack
              direction={{ base: "column", sm: "row" }}
              justify="space-between"
              align={{ base: "flex-start", sm: "center" }}
            >
              <HStack gap={3}>
                <Icon as={LuTag} color={accentColor} boxSize={5} />
                <Heading size="md" color={headerTextColor}>
                  {t("tagSuggestions.yourSuggestions", "Your Suggestions")}
                </Heading>
                <Tag.Root
                  size="md"
                  variant="subtle"
                  colorPalette="teal"
                  borderRadius="full"
                >
                  <TagLabel>{filteredSuggestions.length}</TagLabel>
                </Tag.Root>
              </HStack>
            </Stack>
          </CardHeader>

          <CardBody>
            <Stack direction={{ base: "column", md: "row" }} mb={6} gap={4}>
              <InputGroup
                startElement={<Icon as={LuSearch} color={mutedText} />}
              >
                <Input
                  placeholder={t(
                    "tagSuggestions.searchPlaceholder",
                    "Search suggestions..."
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="md"
                  bg={inputBg}
                  size="lg"
                  borderWidth="1px"
                  borderColor={inputBorderColor}
                  _focus={{
                    borderColor: inputFocusBorderColor,
                    boxShadow: "0 0 0 1px " + inputFocusBorderColor,
                  }}
                  pl="40px"
                />
              </InputGroup>

              <Select.Root
                collection={statusOptions}
                value={[statusFilter]}
                onValueChange={(e) => setStatusFilter(e.value[0])}
                width={{ base: "100%", md: "220px" }}
                size="lg"
                variant="outline"
              >
                <Select.HiddenSelect />
                <Select.Control
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg={inputBg}
                  _hover={{ borderColor: accentColor }}
                  height="48px"
                  borderRadius="md"
                  _dark={{ borderColor: "gray.600" }}
                >
                  <Select.Trigger px={4}>
                    <HStack gap={2}>
                      <Icon as={LuFilter} opacity={0.7} />
                      <Select.ValueText
                        placeholder={t("tagSuggestions.statusLabel")}
                      />
                    </HStack>
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator color={accentColor} />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content
                      borderColor={borderColor}
                      borderRadius="md"
                      boxShadow="lg"
                      bg={cardBg}
                      overflow="hidden"
                    >
                      {statusOptions.items.map((item) => (
                        <Select.Item
                          key={item.value}
                          item={item}
                          py={2}
                          px={4}
                          _hover={{
                            bg: highlightColor,
                          }}
                          _selected={{
                            bg: highlightColor,
                            fontWeight: "medium",
                          }}
                        >
                          {item.label}
                          <Select.ItemIndicator color={accentColor} />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Stack>

            {isLoading ? (
              <Center py={12}>
                <VStack gap={4}>
                  <Spinner size="xl" borderWidth="4px" color={accentColor} />
                  <Text color={mutedText}>
                    {t("tagSuggestions.loading", "Loading suggestions...")}
                  </Text>
                </VStack>
              </Center>
            ) : filteredSuggestions.length > 0 ? (
              <VStack align="stretch" gap={4} w="100%">
                {filteredSuggestions.map((suggestion, index) => (
                  <Card.Root
                    key={`${suggestion.id}-${index}`}
                    borderRadius="lg"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                    overflow="hidden"
                  >
                    <CardBody p={0}>
                      <Box
                        p={4}
                        borderBottomWidth={
                          suggestion.status === "pending" && isAdmin
                            ? "1px"
                            : "0"
                        }
                      >
                        <Stack
                          direction={{ base: "column", sm: "row" }}
                          justify="space-between"
                          align={{ base: "flex-start", sm: "center" }}
                          mb={3}
                        >
                          <HStack wrap="wrap" gap={2}>
                            <Tag.Root
                              size="md"
                              py={1}
                              bg={statusColors[suggestion.status].bg}
                              color={statusColors[suggestion.status].color}
                            >
                              <Tag.StartElement>
                                {statusColors[suggestion.status].icon}
                              </Tag.StartElement>
                              <TagLabel>
                                {t(
                                  `tagSuggestions.status${
                                    suggestion.status.charAt(0).toUpperCase() +
                                    suggestion.status.slice(1)
                                  }`,
                                  suggestion.status.charAt(0).toUpperCase() +
                                    suggestion.status.slice(1)
                                )}
                              </TagLabel>
                            </Tag.Root>

                            <Tag.Root size="sm" variant="subtle">
                              <Tag.StartElement>
                                <LuCalendar />
                              </Tag.StartElement>
                              <TagLabel fontSize="xs">
                                {getFormattedDate(suggestion.createdAt)}
                              </TagLabel>
                            </Tag.Root>
                          </HStack>
                        </Stack>

                        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                          <Box>
                            <Text fontSize="xs" color={mutedText} mb={1}>
                              {t("tagSuggestions.englishLabel", "English")}
                            </Text>
                            <Text fontWeight="medium" fontSize="md">
                              {suggestion.translations.en || "-"}
                            </Text>
                          </Box>

                          <Box>
                            <Text fontSize="xs" color={mutedText} mb={1}>
                              {t("tagSuggestions.hebrewLabel", "Hebrew")}
                            </Text>
                            <Text fontWeight="medium" fontSize="md">
                              {suggestion.translations.he || "-"}
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </Box>

                      {isAdmin && suggestion.status === "pending" && (
                        <Flex justify="flex-end" bg={adminBg} p={3} gap={2}>
                          <Button
                            size="sm"
                            colorPalette="green"
                            onClick={() =>
                              handleChangeStatus(suggestion.docId, "approved")
                            }
                          >
                            <LuCircleCheck />
                            {t("tagSuggestions.actions.approve", "Approve")}
                          </Button>
                          <Button
                            size="sm"
                            colorPalette="red"
                            onClick={() =>
                              handleChangeStatus(suggestion.docId, "rejected")
                            }
                          >
                            <LuCircleX />
                            {t("tagSuggestions.actions.reject", "Reject")}
                          </Button>
                        </Flex>
                      )}
                    </CardBody>
                  </Card.Root>
                ))}
              </VStack>
            ) : (
              <Center py={12}>
                <VStack gap={4}>
                  <Icon
                    as={LuTag}
                    boxSize={12}
                    color={mutedText}
                    opacity={0.5}
                  />
                  <Text color={mutedText} fontSize="lg">
                    {t(
                      "tagSuggestions.noSuggestionsFound",
                      "No tag suggestions found"
                    )}
                  </Text>
                  {searchQuery || statusFilter !== "all" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      {t("tagSuggestions.clearFilters", "Clear filters")}
                    </Button>
                  ) : null}
                </VStack>
              </Center>
            )}
          </CardBody>
        </Card.Root>
      </Container>

      <Footer />
    </Box>
  );
}
