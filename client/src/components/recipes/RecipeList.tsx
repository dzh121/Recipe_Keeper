"use client";

import {
  Box,
  Checkbox,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  InputGroup,
  Icon,
  Button,
  Flex,
  Tag,
  Pagination,
  Link,
  Select,
  Menu,
  Portal,
  createListCollection,
  Avatar,
  IconButton,
  ButtonGroup,
  Collapsible,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from "react";
import {
  LuChefHat,
  LuLink,
  LuSearch,
  LuFilter,
  LuPlus,
  LuTag,
  LuChevronDown,
  LuGlobe,
  LuCheck,
  LuChevronUp,
  LuSettings,
} from "react-icons/lu";
import { MdOutlineEdit, MdOutlineFavorite } from "react-icons/md";
import { FiX } from "react-icons/fi";
import { LuX } from "react-icons/lu";
import NextLink from "next/link";
import { useColorModeValue } from "@/components/ui/color-mode";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import type { Tag as TagType } from "@/lib/types/tag";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuthAndAppCheck } from "@/lib/fetch";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type Recipe = {
  id: string;
  title: string;
  isPublic: boolean;
  tags?: string[];
  kosher?: boolean;
  recipeType?: "link" | "homemade";
  ownerId?: string;
  imageURL?: string;
};

type UserProfile = {
  displayName: string;
  slug?: string;
  photoURL?: string;
};

interface RecipeListProps {
  title: string;
  isPublic?: boolean;
  allowEdit?: boolean;
  showAddButton?: boolean;
  showPublicTag?: boolean;
  showPublisher?: boolean;
  showFavorite?: boolean;
  owner?: boolean;
  onAddClick?: () => void;
  onEditClick?: (id: string) => void;
  onFavoriteClick?: (id: string) => void;
  onlyFavorites?: boolean;
  refreshKey?: number;
}

export default function RecipeList({
  title,
  isPublic = true,
  allowEdit = false,
  showAddButton = false,
  showPublicTag = false,
  showPublisher = false,
  showFavorite = false,
  owner = false,
  onAddClick,
  onEditClick,
  onFavoriteClick,
  onlyFavorites = false,
  refreshKey,
}: RecipeListProps) {
  const [tagSearch, setTagSearch] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [tagOptions, setTagOptions] = useState<TagType[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("recipeSearchQuery") || "";
  });

  const [rawSearchQuery, setRawSearchQuery] = useState(searchQuery);

  const [typeFilter, setTypeFilter] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["all"];
    return JSON.parse(localStorage.getItem("recipeTypeFilter") || '["all"]');
  });

  const [visibilityFilter, setVisibilityFilter] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["all"];
    return JSON.parse(
      localStorage.getItem("recipeVisibilityFilter") || '["all"]'
    );
  });

  const [isKosher, setIsKosher] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("recipeKosherFilter");
    if (stored !== null) return JSON.parse(stored);

    const defaultKosher = localStorage.getItem("defaultKosher");
    return defaultKosher !== null ? JSON.parse(defaultKosher) : null;
  });

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("recipeSelectedTags") || "[]");
  });

  const [page, setPage] = useState(1);
  const [paginatedRecipes, setPaginatedRecipes] = useState<Recipe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const { t, i18n } = useTranslation();
  const { user, authChecked } = useAuth();
  const router = useRouter();

  const recipeTypes = createListCollection({
    items: [
      { label: t("recipeList.typeAll"), value: "all" },
      { label: t("recipeList.typeLink"), value: "link" },
      { label: t("recipeList.typeHomemade"), value: "homemade" },
    ],
  });
  const recipePublic = createListCollection({
    items: [
      { label: t("recipeList.visibilityAll"), value: "all" },
      { label: t("recipeList.visibilityPublic"), value: "public" },
      { label: t("recipeList.visibilityPrivate"), value: "private" },
    ],
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(rawSearchQuery);
      localStorage.setItem("recipeSearchQuery", rawSearchQuery);
    }, 400); // debounce delay in ms

    return () => clearTimeout(timeout);
  }, [rawSearchQuery]);

  useEffect(() => {
    if (!authChecked) return;

    const fetchRecipes = async () => {
      let type = isPublic ? "public" : "private";
      if (owner) {
        type = "owner";
      }
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(),
        type: type,
        recipeType: typeFilter[0],
        ...(searchQuery && { search: searchQuery }),
        ...(isKosher !== null && { kosher: isKosher.toString() }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(",") }),
        ...((owner || !isPublic) &&
          visibilityFilter[0] !== "all" && {
            visibility: visibilityFilter[0],
          }),
        ...(onlyFavorites && { favorites: "true" }),
      });

      if (authChecked && !user && !isPublic) {
        console.error("User is not authenticated");
        return;
      }

      // Get the token for authenticated users
      const token = await user?.getIdToken();

      try {
        const res = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/recipes?${params}`,
          {
            method: "GET",
            token,
          }
        );
        const data = await res.json();
        setPaginatedRecipes(data.recipes || []);
        setTotalCount(data.totalCount || 0);
      } catch (err) {
        console.error("Failed to fetch paginated recipes", err);
      }
    };

    fetchRecipes();
  }, [
    page,
    typeFilter,
    visibilityFilter,
    selectedTags,
    searchQuery,
    isKosher,
    user,
    authChecked,
    isPublic,
    owner,
    onlyFavorites,
    refreshKey,
  ]);

  const sortAndSetTags = useCallback(
    (tags: TagType[]) => {
      const lang = i18n.language || "en";
      const sorted = [...tags].sort((a, b) =>
        a.translations[lang]?.localeCompare(
          b.translations[lang],
          lang === "he" ? "he" : "en",
          { sensitivity: "base" }
        )
      );
      setTagOptions((prev) => {
        const prevJSON = JSON.stringify(prev);
        const nextJSON = JSON.stringify(sorted);
        return prevJSON === nextJSON ? prev : sorted;
      });
    },
    [i18n.language]
  );

  useEffect(() => {
    sortAndSetTags(tagOptions);
  }, [sortAndSetTags, tagOptions]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetchWithAuthAndAppCheck(
          `${process.env.NEXT_PUBLIC_API_URL}/tags`,
          {
            method: "GET",
          }
        );
        if (!response.ok) {
          //get exact error message
          const errorMessage = await response.text();
          console.error("Error fetching tags:", errorMessage);
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        setTagOptions(data.tags || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);
  // Fetch user profiles for recipes if showPublisher is true
  useEffect(() => {
    if (showPublisher) {
      const fetchUserProfiles = async () => {
        const userIds = [
          ...new Set(
            paginatedRecipes.map((recipe) => recipe.ownerId).filter(Boolean)
          ),
        ];
        const profiles: Record<string, UserProfile> = {};

        // For each unique user ID, fetch their profile
        for (const uid of userIds) {
          try {
            if (!uid) continue;
            const authorRef = doc(db, "users", uid, "public", "profile");
            const authorSnapshot = await getDoc(authorRef);

            if (authorSnapshot.exists()) {
              const userData = authorSnapshot.data();
              profiles[uid] = {
                displayName: userData.displayName || "Unknown User",
                photoURL: userData.photoURL || undefined,
                slug: userData.slug || undefined,
              };
            } else {
              console.warn(`User profile not found for UID: ${uid}`);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        }

        setUserProfiles(profiles);
      };

      fetchUserProfiles();
    }
  }, [paginatedRecipes, showPublisher]);

  const handleDeleteClick = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this recipe?");
    if (!confirmed) return;

    const token = await user?.getIdToken();
    try {
      await fetchWithAuthAndAppCheck(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/delete-recipe/${id}`,
        {
          method: "DELETE",
          token,
        }
      );

      // Refresh recipe list after deletion
      setPaginatedRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete recipe:", err);
    }
  };

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      localStorage.setItem("recipeSelectedTags", JSON.stringify(newTags));
    }
  };

  const handleTagRemove = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag);
    setSelectedTags(newTags);
    localStorage.setItem("recipeSelectedTags", JSON.stringify(newTags));
  };

  const clearFilters = () => {
    setTypeFilter(["all"]);
    setSelectedTags([]);
    setSearchQuery("");
    setRawSearchQuery("");
    setVisibilityFilter(["all"]);
    setIsKosher(null);

    localStorage.removeItem("recipeSearchQuery");
    localStorage.removeItem("recipeTypeFilter");
    localStorage.removeItem("recipeVisibilityFilter");
    localStorage.removeItem("recipeKosherFilter");
    localStorage.removeItem("recipeSelectedTags");
  };

  const filteredTags = tagOptions.filter(
    (tag) =>
      !selectedTags.includes(tag.id) &&
      tag.translations[i18n.language || "en"]
        ?.toLowerCase()
        .includes(tagSearch.toLowerCase())
  );

  // Check if any filters are active
  const hasActiveFilters =
    typeFilter[0] !== "all" ||
    selectedTags.length > 0 ||
    isKosher ||
    visibilityFilter[0] !== "all" ||
    searchQuery;

  return (
    <VStack align="stretch" gap={6}>
      <Box
        pb={4}
        borderBottom="2px solid"
        borderColor="gray.200"
        _dark={{ borderColor: "gray.700" }}
      >
        <Flex
          justify="space-between"
          alignItems="center"
          flexWrap={{ base: "wrap", sm: "nowrap" }}
          gap={4}
        >
          <Flex align="center" mb={4}>
            <Box position="relative" display="inline-block">
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="bold"
                color={textColor}
                letterSpacing="tight"
                lineHeight="1.5"
                pb={2}
                display="inline"
              >
                {title}
              </Text>
              <Box
                position="absolute"
                bottom="0"
                left="0"
                width="100%"
                height="3px"
                bg="teal.500"
                borderRadius="full"
              />
            </Box>
          </Flex>

          {showAddButton && (
            <Button
              colorPalette="teal"
              onClick={onAddClick}
              size="md"
              px={4}
              py={6}
              borderRadius="md"
              fontWeight="semibold"
              boxShadow="sm"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
              transition="all 0.2s"
            >
              <Icon as={LuPlus} boxSize={5} />
              {t("recipeList.addRecipe")}
            </Button>
          )}
        </Flex>
      </Box>

      {/* Compact Search and Filter Section */}
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        bg={cardBg}
        borderColor="gray.200"
        boxShadow="sm"
        _dark={{ borderColor: "gray.700" }}
      >
        <VStack gap={4} align="stretch">
          {/* Main search bar with inline quick filters */}
          <Flex gap={3} align="center" flexWrap="wrap">
            {/* Search input - takes up most space */}
            <Box flex="1" minW="250px">
              <InputGroup
                startElement={
                  <Icon as={LuSearch} color="teal.500" boxSize={4} />
                }
              >
                <Input
                  size="sm"
                  borderWidth="1px"
                  borderColor="gray.300"
                  _hover={{ borderColor: "teal.400" }}
                  _focus={{
                    borderColor: "teal.500",
                    boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)",
                  }}
                  placeholder={t("recipeList.searchPlaceholder")}
                  value={rawSearchQuery}
                  onChange={(e) => setRawSearchQuery(e.target.value)}
                  borderRadius="md"
                  height="36px"
                  _dark={{ borderColor: "gray.600" }}
                />
              </InputGroup>
            </Box>

            {/* Quick filters */}
            <Checkbox.Root
              colorPalette="teal"
              size="sm"
              checked={isKosher === true}
              onCheckedChange={(e) => {
                const value = e.checked ? true : null;
                setIsKosher(value);
                localStorage.setItem(
                  "recipeKosherFilter",
                  JSON.stringify(value)
                );
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control
                border="1px solid"
                borderColor="gray.400"
                _dark={{ borderColor: "gray.600" }}
                borderRadius="sm"
              />
              <Checkbox.Label fontSize="sm">
                {t("recipeList.kosherOnly")}
              </Checkbox.Label>
            </Checkbox.Root>

            {/* Advanced filters toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              borderColor="gray.300"
              _hover={{ borderColor: "teal.500", bg: "teal.50" }}
              _dark={{ borderColor: "gray.600", _hover: { bg: "teal.900" } }}
            >
              <Icon as={LuSettings} mr={1} />
              {t("recipeList.filters")}
              {hasActiveFilters && (
                <Badge
                  ml={1}
                  colorPalette="teal"
                  size="xs"
                  borderRadius="full"
                  px={1.5}
                >
                  {(typeFilter[0] !== "all" ? 1 : 0) +
                    selectedTags.length +
                    (visibilityFilter[0] !== "all" ? 1 : 0) +
                    (isKosher ? 1 : 0) +
                    (searchQuery ? 1 : 0)}
                </Badge>
              )}
              {filtersExpanded ? <LuChevronUp /> : <LuChevronDown />}
            </Button>

            {/* Clear filters - only show when filters are active */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                color="red.500"
                _hover={{ bg: "red.50", _dark: { bg: "red.900" } }}
                _dark={{ color: "red.300" }}
              >
                <Icon as={LuX} mr={1} />
                {t("recipeList.clearFilters")}
              </Button>
            )}
          </Flex>

          {/* Selected tags - always visible when present */}
          {selectedTags.length > 0 && (
            <Flex wrap="wrap" gap={2}>
              {selectedTags.map((tag) => (
                <Tag.Root
                  asChild
                  key={tag}
                  size="sm"
                  variant="solid"
                  colorPalette="teal"
                  borderRadius="full"
                >
                  <button
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTagRemove(tag)}
                  >
                    <Tag.Label fontSize="xs" mr={1}>
                      {tagOptions.find((t) => t.id === tag)?.translations[
                        i18n.language
                      ] ??
                        tagOptions.find((t) => t.id === tag)?.translations.en ??
                        tag}
                    </Tag.Label>
                    <Icon as={FiX} boxSize={3} />
                  </button>
                </Tag.Root>
              ))}
            </Flex>
          )}

          {/* Expandable advanced filters */}
          <Collapsible.Root open={filtersExpanded}>
            <Collapsible.Content>
              <Box
                pt={2}
                borderTop="1px solid"
                borderColor="gray.200"
                _dark={{ borderColor: "gray.700" }}
              >
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={4}
                >
                  {/* Type filter */}
                  <GridItem>
                    <VStack align="stretch" gap={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                      >
                        <Icon as={LuFilter} mr={1} />
                        {t("recipeList.typeLabel")}
                      </Text>
                      <Select.Root
                        collection={recipeTypes}
                        value={typeFilter}
                        onValueChange={(e) => {
                          setTypeFilter(e.value);
                          localStorage.setItem(
                            "recipeTypeFilter",
                            JSON.stringify(e.value)
                          );
                        }}
                        size="sm"
                      >
                        <Select.HiddenSelect />
                        <Select.Control
                          borderWidth="1px"
                          borderColor="gray.300"
                          _hover={{ borderColor: "teal.500" }}
                          borderRadius="md"
                          _dark={{ borderColor: "gray.600" }}
                        >
                          <Select.Trigger px={3}>
                            <Select.ValueText />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator color="teal.500" />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content
                              bg={cardBg}
                              borderColor="gray.200"
                              _dark={{ borderColor: "gray.700" }}
                              borderRadius="md"
                              boxShadow="lg"
                            >
                              {recipeTypes.items.map((item) => (
                                <Select.Item
                                  item={item}
                                  key={item.value}
                                  _hover={{
                                    bg: "teal.50",
                                    _dark: { bg: "teal.900" },
                                  }}
                                  _selected={{
                                    bg: "teal.100",
                                    _dark: { bg: "teal.800" },
                                  }}
                                >
                                  {item.label}
                                  <Select.ItemIndicator color="teal.500" />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    </VStack>
                  </GridItem>

                  {/* Visibility filter */}
                  {showPublicTag && (
                    <GridItem>
                      <VStack align="stretch" gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          <Icon as={LuGlobe} mr={1} />
                          {t("recipeList.visibilityLabel")}
                        </Text>
                        <Select.Root
                          collection={recipePublic}
                          value={visibilityFilter}
                          onValueChange={(e) => {
                            setVisibilityFilter(e.value);
                            localStorage.setItem(
                              "recipeVisibilityFilter",
                              JSON.stringify(e.value)
                            );
                          }}
                          size="sm"
                        >
                          <Select.HiddenSelect />
                          <Select.Control
                            borderWidth="1px"
                            borderColor="gray.300"
                            _hover={{ borderColor: "teal.500" }}
                            borderRadius="md"
                            _dark={{ borderColor: "gray.600" }}
                          >
                            <Select.Trigger px={3}>
                              <Select.ValueText />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator color="teal.500" />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Portal>
                            <Select.Positioner>
                              <Select.Content
                                bg={cardBg}
                                borderColor="gray.200"
                                _dark={{ borderColor: "gray.700" }}
                                borderRadius="md"
                                boxShadow="lg"
                              >
                                {recipePublic.items.map((item) => (
                                  <Select.Item
                                    item={item}
                                    key={item.value}
                                    _hover={{
                                      bg: "teal.50",
                                      _dark: { bg: "teal.900" },
                                    }}
                                    _selected={{
                                      bg: "teal.100",
                                      _dark: { bg: "teal.800" },
                                    }}
                                  >
                                    {item.label}
                                    <Select.ItemIndicator color="teal.500" />
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Portal>
                        </Select.Root>
                      </VStack>
                    </GridItem>
                  )}

                  {/* Tag filter */}
                  <GridItem colSpan={{ base: 1, md: showPublicTag ? 1 : 2 }}>
                    <VStack align="stretch" gap={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                      >
                        <Icon as={LuTag} mr={1} />
                        {t("recipeList.tagsLabel")}
                      </Text>
                      <Menu.Root closeOnSelect={false}>
                        <Menu.Trigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            borderWidth="1px"
                            borderColor="gray.300"
                            _hover={{ borderColor: "teal.500" }}
                            _dark={{ borderColor: "gray.600" }}
                            px={3}
                            borderRadius="md"
                            width="full"
                            justifyContent="space-between"
                          >
                            <Text fontSize="sm">
                              {t("recipeList.selectTags")}
                            </Text>
                            <Icon as={LuChevronDown} color="teal.500" />
                          </Button>
                        </Menu.Trigger>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content
                              maxH="300px"
                              overflowY="auto"
                              minW="240px"
                              bg={cardBg}
                              borderColor="gray.200"
                              _dark={{ borderColor: "gray.700" }}
                              borderRadius="md"
                              boxShadow="lg"
                            >
                              <Box px={3} py={2}>
                                <InputGroup
                                  startElement={
                                    <Icon
                                      as={LuSearch}
                                      color="gray.400"
                                      boxSize={3}
                                    />
                                  }
                                >
                                  <Input
                                    placeholder={t(
                                      "recipeList.tagSearchPlaceholder"
                                    )}
                                    size="sm"
                                    value={tagSearch}
                                    onChange={(e) =>
                                      setTagSearch(e.target.value)
                                    }
                                    borderColor="gray.300"
                                    _focus={{ borderColor: "teal.500" }}
                                    _dark={{ borderColor: "gray.600" }}
                                  />
                                </InputGroup>
                              </Box>

                              {filteredTags.length > 0 ? (
                                filteredTags.map((tag) => (
                                  <Menu.Item
                                    key={tag.id}
                                    value={tag.id}
                                    onClick={() => handleTagSelect(tag.id)}
                                    _hover={{
                                      bg: "teal.50",
                                      _dark: { bg: "teal.900" },
                                    }}
                                    px={3}
                                    py={2}
                                    role="menuitem"
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    fontSize="sm"
                                  >
                                    <Text>
                                      {tag.translations[i18n.language] ??
                                        tag.translations.en ??
                                        tag.id}
                                    </Text>
                                    {selectedTags.includes(tag.id) && (
                                      <Icon as={LuCheck} color="teal.500" />
                                    )}
                                  </Menu.Item>
                                ))
                              ) : (
                                <Box
                                  px={3}
                                  py={2}
                                  textAlign="center"
                                  color="gray.500"
                                  fontSize="sm"
                                >
                                  {t("recipeList.noTagsFound")}
                                </Box>
                              )}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </VStack>
                  </GridItem>
                </Grid>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </VStack>
      </Box>

      {/* Results header with count */}
      <HStack justify="space-between">
        <Text fontWeight="medium" color={textColor} fontSize="sm">
          {t("recipeList.recipesFound", { count: totalCount })}
        </Text>
      </HStack>

      {/* Results */}
      {paginatedRecipes.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          borderWidth="1px"
          borderRadius="md"
          bg={cardBg}
          borderColor={borderColor}
        >
          <Text fontSize="lg">{t("recipeList.noRecipes")}</Text>
          {/* if there are active filters show a button to clear them */}
          {hasActiveFilters && (
            <Button
              mt={4}
              colorPalette="teal"
              variant="outline"
              onClick={clearFilters}
            >
              {t("recipeList.clearFilters")}
            </Button>
          )}
        </Box>
      ) : (
        <VStack align="stretch" gap={4}>
          {paginatedRecipes.map((recipe) => (
            <Link
              as={NextLink}
              href={`/recipes/${recipe.id}`}
              style={{ display: "block", width: "100%" }}
              _hover={{ textDecoration: "none" }}
              key={recipe.id}
            >
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg={cardBg}
                borderColor={borderColor}
                _hover={{
                  shadow: "lg",
                  transform: "translateY(-1px)",
                  transition: "all 0.2s",
                }}
                cursor="pointer"
              >
                {/* Main Content Container */}
                <VStack align="stretch" gap={4}>
                  {/* Header with Title and Action Buttons */}
                  <HStack justify="space-between" align="start">
                    <HStack align="center" flex="1">
                      <Icon
                        as={
                          recipe.recipeType === "homemade" ? LuChefHat : LuLink
                        }
                        color="teal.500"
                        fontSize={"xl"}
                        flexShrink={0}
                      />
                      <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color="teal.500"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        {recipe.title || "Untitled Recipe"}
                      </Text>
                    </HStack>

                    <HStack gap={2} flexShrink={0}>
                      {owner && (
                        <Tooltip
                          content="Delete recipe"
                          positioning={{ placement: "top" }}
                        >
                          <IconButton
                            aria-label="Delete"
                            variant="outline"
                            size="sm"
                            colorPalette="red"
                            borderRadius="full"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteClick(recipe.id);
                            }}
                          >
                            <FiX />
                          </IconButton>
                        </Tooltip>
                      )}

                      {allowEdit && (
                        <Tooltip
                          content={t("recipeList.editTooltip")}
                          positioning={{ placement: "top" }}
                        >
                          <Flex gap={2} align="center">
                            {/* IconButton for larger screens */}
                            <IconButton
                              aria-label="Edit"
                              display={{ base: "none", sm: "inline-flex" }}
                              variant="outline"
                              size="sm"
                              colorPalette="teal"
                              borderRadius="full"
                              onClick={(e) => {
                                e.preventDefault();
                                onEditClick?.(recipe.id);
                              }}
                            >
                              <MdOutlineEdit />
                            </IconButton>

                            {/* Full button on small screens */}
                            <Button
                              size="sm"
                              variant="outline"
                              colorPalette="teal"
                              display={{ base: "inline-flex", sm: "none" }}
                              onClick={(e) => {
                                e.preventDefault();
                                onEditClick?.(recipe.id);
                              }}
                            >
                              <MdOutlineEdit />
                              {t("recipeList.editButton")}
                            </Button>
                          </Flex>
                        </Tooltip>
                      )}

                      {showFavorite && (
                        <Tooltip
                          content={t("recipeList.removeFavoriteTooltip")}
                          positioning={{ placement: "top" }}
                        >
                          <IconButton
                            aria-label={t("recipeList.removeFavoriteTooltip")}
                            variant="ghost"
                            size="sm"
                            colorPalette="red"
                            onClick={(e) => {
                              e.preventDefault();
                              onFavoriteClick?.(recipe.id);
                            }}
                          >
                            <MdOutlineFavorite />
                          </IconButton>
                        </Tooltip>
                      )}
                    </HStack>
                  </HStack>

                  {/* Badges Row */}
                  <Flex wrap="wrap" gap={2}>
                    {recipe.kosher && (
                      <Badge
                        colorPalette="purple"
                        size="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {t("recipeList.kosherBadge")}
                      </Badge>
                    )}

                    {showPublicTag && (
                      <Badge
                        colorPalette={recipe.isPublic ? "green" : "gray"}
                        size="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {recipe.isPublic
                          ? t("recipeList.public")
                          : t("recipeList.private")}
                      </Badge>
                    )}

                    <Badge
                      colorPalette={
                        recipe.recipeType === "homemade" ? "orange" : "blue"
                      }
                      size="xs"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {recipe.recipeType === "homemade"
                        ? t("recipeList.homemade")
                        : t("recipeList.link")}
                    </Badge>
                  </Flex>

                  {/* Publisher information */}
                  {showPublisher &&
                    recipe.ownerId &&
                    userProfiles[recipe.ownerId] &&
                    (() => {
                      const ownerId = recipe.ownerId as string;
                      const profile = userProfiles[ownerId];

                      return (
                        <HStack
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (profile.slug) {
                              router.push(`/user/${profile.slug}`);
                            }
                          }}
                          gap={2}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                          _hover={{ textDecoration: "underline" }}
                          cursor="pointer"
                        >
                          <Avatar.Root
                            size="xs"
                            colorPalette="teal"
                            variant="solid"
                          >
                            <Avatar.Fallback name={profile.displayName} />
                            <Avatar.Image
                              src={profile.photoURL || undefined}
                              alt="User Avatar"
                              borderRadius="full"
                            />
                          </Avatar.Root>
                          <Text fontSize="sm">{profile.displayName}</Text>
                        </HStack>
                      );
                    })()}

                  {/* Main Content Area with Image and Tags */}
                  <HStack align="start" gap={4}>
                    {/* Image Section - Fixed size on the left */}
                    {recipe.imageURL && (
                      <Box
                        width="140px"
                        height="100px"
                        borderRadius="md"
                        overflow="hidden"
                        bg="gray.50"
                        _dark={{ bg: "gray.800", borderColor: "gray.600" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        border="1px solid"
                        borderColor="gray.200"
                      >
                        <Image
                          src={recipe.imageURL}
                          alt={recipe.title || "Recipe Image"}
                          width={140}
                          height={100}
                          style={{
                            borderRadius: "6px",
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </Box>
                    )}

                    {/* Tags Section - Takes remaining space */}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <VStack align="start" flex="1" gap={2}>
                        <Flex wrap="wrap" gap={2}>
                          {recipe.tags.map((tagId) => {
                            const tagObj = tagOptions.find(
                              (t) => t.id === tagId
                            );
                            const label =
                              tagObj?.translations[i18n.language] ??
                              tagObj?.translations.en ??
                              tagId;

                            return (
                              <Tag.Root
                                key={tagId}
                                size="sm"
                                borderRadius="full"
                                variant="subtle"
                                onClick={(e) => {
                                  e.preventDefault();
                                  !selectedTags.includes(tagId) &&
                                    handleTagSelect(tagId);
                                }}
                                cursor="pointer"
                                _hover={{
                                  transform: "scale(1.05)",
                                  transition: "transform 0.1s",
                                }}
                              >
                                <Tag.Label>{label}</Tag.Label>
                              </Tag.Root>
                            );
                          })}
                        </Flex>
                      </VStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
            </Link>
          ))}
          <Pagination.Root
            count={totalCount}
            pageSize={pageSize}
            page={page}
            onPageChange={(e) => setPage(e.page)}
          >
            <ButtonGroup variant="ghost" size="sm" justifyContent="center">
              <Pagination.PrevTrigger asChild>
                <IconButton aria-label="Previous">
                  <HiChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>

              <Pagination.Items
                render={(pageObj) => (
                  <IconButton
                    key={pageObj.value}
                    variant={{ base: "ghost", _selected: "outline" }}
                  >
                    {pageObj.value}
                  </IconButton>
                )}
              />

              <Pagination.NextTrigger asChild>
                <IconButton aria-label="Next">
                  <HiChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </VStack>
      )}
    </VStack>
  );
}
