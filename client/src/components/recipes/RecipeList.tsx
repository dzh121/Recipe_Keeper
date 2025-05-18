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
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
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
  LuShieldCheck,
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
import { getAuth } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

export type Recipe = {
  id: string;
  title: string;
  isPublic: boolean;
  tags?: string[];
  kosher?: boolean;
  recipeType?: "link" | "homemade";
  ownerId?: string;
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
}: RecipeListProps) {
  const [tagSearch, setTagSearch] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [tagOptions, setTagOptions] = useState<TagType[]>([]);

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

      if (!user && !isPublic) {
        console.error("User is not authenticated");
        return;
      }

      // Get the token for authenticated users
      const token = await user?.getIdToken();

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/recipes?${params}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
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
  ]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tags`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          //get exact error message
          const errorMessage = await response.text();
          console.error("Error fetching tags:", errorMessage);
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();
        sortAndSetTags(data.tags || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    sortAndSetTags(tagOptions);
  }, [i18n.language]);

  function sortAndSetTags(tags: TagType[]) {
    const lang = i18n.language || "en";
    const sorted = [...tags].sort((a, b) =>
      a.translations[lang]?.localeCompare(
        b.translations[lang],
        lang === "he" ? "he" : "en",
        { sensitivity: "base" }
      )
    );
    setTagOptions(sorted);
  }

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
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/delete-recipe/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  return (
    <VStack align="stretch" gap={8}>
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

      {/* Search and filter section */}
      <Box
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg={cardBg}
        borderColor="gray.200"
        boxShadow="sm"
        _dark={{ borderColor: "gray.700" }}
      >
        <VStack gap={6} align="stretch">
          {/* Search bar with improved styling */}
          <InputGroup
            startElement={<Icon as={LuSearch} color="teal.500" boxSize={5} />}
          >
            <Input
              size="md"
              borderWidth="2px"
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
              fontSize="md"
              height="48px"
              _dark={{ borderColor: "gray.600" }}
            />
          </InputGroup>

          {/* Filters row with improved spacing and styling */}
          <Flex gap={5} flexWrap="wrap" align="center" mb={4}>
            {/* Type filter */}
            <HStack gap={2} minW={{ base: "full", md: "220px" }}>
              <Icon as={LuFilter} color="teal.500" boxSize={5} />
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
                variant="outline"
                width="full"
              >
                <Select.HiddenSelect />
                <Select.Label fontWeight="medium">
                  {t("recipeList.typeLabel")}
                </Select.Label>
                <Select.Control
                  borderWidth="2px"
                  borderColor="gray.300"
                  _hover={{ borderColor: "teal.500" }}
                  height="40px"
                  borderRadius="md"
                  _dark={{ borderColor: "gray.600" }}
                >
                  <Select.Trigger px={3}>
                    <Select.ValueText
                      placeholder={t("recipeList.typePlaceholder")}
                    />
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
            </HStack>

            <HStack gap={2}>
              <Icon as={LuShieldCheck} color="teal.500" boxSize={5} />
              <Checkbox.Root
                colorPalette="teal"
                size="md"
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
                  border="1.5px solid"
                  borderColor="gray.400"
                  _dark={{ borderColor: "gray.600" }}
                  borderRadius="md"
                />
                <Checkbox.Label>{t("recipeList.kosherOnly")}</Checkbox.Label>
              </Checkbox.Root>
            </HStack>

            {/* Visibility filter */}
            {showPublicTag && (
              <HStack gap={2} minW={{ md: "160px" }}>
                <Icon as={LuGlobe} color="teal.500" boxSize={5} />
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
                  width="160px"
                >
                  <Select.Label fontWeight="medium">
                    {t("recipeList.visibilityLabel")}
                  </Select.Label>
                  <Select.HiddenSelect />
                  <Select.Control
                    borderWidth="2px"
                    borderColor="gray.300"
                    _hover={{ borderColor: "teal.500" }}
                    height="40px"
                    borderRadius="md"
                    _dark={{ borderColor: "gray.600" }}
                  >
                    <Select.Trigger px={3}>
                      <Select.ValueText
                        placeholder={t("recipeList.visibilityPlaceholder")}
                      />
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
              </HStack>
            )}

            {/* Tag filter */}
            <HStack gap={2} flex="1">
              <Icon as={LuTag} color="teal.500" boxSize={5} />
              <VStack gap={1} align="flex-start" width="full">
                <Text fontWeight="medium">{t("recipeList.tagsLabel")}</Text>
                <Menu.Root closeOnSelect={false}>
                  <Menu.Trigger asChild>
                    <Button
                      size="md"
                      height="40px"
                      variant="outline"
                      borderWidth="2px"
                      borderColor="gray.300"
                      _hover={{ borderColor: "teal.500" }}
                      _dark={{ borderColor: "gray.600" }}
                      px={4}
                      borderRadius="md"
                      width="full"
                      justifyContent="space-between"
                    >
                      <Text>{t("recipeList.selectTags")}</Text>
                      <Icon as={LuChevronDown} ml={2} />
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        maxH="350px"
                        overflowY="auto"
                        minW="240px"
                        bg={cardBg}
                        borderColor="gray.200"
                        _dark={{ borderColor: "gray.700" }}
                        borderRadius="md"
                        boxShadow="lg"
                      >
                        <Box px={4} py={3}>
                          <InputGroup
                            startElement={
                              <Icon
                                as={LuSearch}
                                color="gray.400"
                                boxSize={4}
                              />
                            }
                          >
                            <Input
                              placeholder={t("recipeList.tagSearchPlaceholder")}
                              size="md"
                              value={tagSearch}
                              onChange={(e) => setTagSearch(e.target.value)}
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
                              px={4}
                              py={2}
                              role="menuitem"
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
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
                            px={4}
                            py={3}
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
            </HStack>

            {/* Clear filters button - only show when filters are applied */}
            {(typeFilter[0] !== "all" ||
              selectedTags.length > 0 ||
              isKosher ||
              visibilityFilter[0] !== "all" ||
              searchQuery) && (
              <Button
                size="md"
                variant="ghost"
                onClick={clearFilters}
                color="teal.600"
                _hover={{ bg: "teal.50", _dark: { bg: "teal.900" } }}
                _dark={{ color: "teal.200" }}
                height="40px"
              >
                <Icon as={LuX} />
                {t("recipeList.clearFilters")}
              </Button>
            )}
          </Flex>

          {/* Selected tags with improved styling */}
          {selectedTags.length > 0 && (
            <Flex wrap="wrap" gap={3} mt={2}>
              {selectedTags.map((tag) => (
                <Tag.Root
                  asChild
                  key={tag}
                  size="md"
                  variant="solid"
                  colorPalette="teal"
                  borderRadius="full"
                  py={1.5}
                  px={3.5}
                >
                  <button
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTagRemove(tag)}
                  >
                    <Tag.Label fontWeight="medium" mr={1}>
                      {tagOptions.find((t) => t.id === tag)?.translations[
                        i18n.language
                      ] ??
                        tagOptions.find((t) => t.id === tag)?.translations.en ??
                        tag}
                    </Tag.Label>

                    <Icon as={FiX} boxSize={3.5} />
                  </button>
                </Tag.Root>
              ))}
            </Flex>
          )}
        </VStack>
      </Box>

      {/* Results header with count */}
      <HStack justify="space-between">
        <Text fontWeight="medium" color={textColor}>
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
          <Button
            mt={4}
            colorPalette="teal"
            variant="outline"
            onClick={clearFilters}
          >
            {t("recipeList.clearFilters")}
          </Button>
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
                _hover={{ shadow: "md", transition: "all 0.2s" }}
                cursor="pointer"
              >
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon
                      as={recipe.recipeType === "homemade" ? LuChefHat : LuLink}
                      color="teal.500"
                      fontSize={"xl"}
                    />
                    <Text fontWeight="bold" fontSize="lg" color="teal.500">
                      {recipe.title || "Untitled Recipe"}
                    </Text>
                  </HStack>

                  <HStack gap={2}>
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
                            e.preventDefault(); // prevent navigation
                            onFavoriteClick?.(recipe.id);
                          }}
                        >
                          <MdOutlineFavorite />
                        </IconButton>
                      </Tooltip>
                    )}
                  </HStack>
                </HStack>

                {/* Publisher information */}
                {showPublisher &&
                  recipe.ownerId &&
                  userProfiles[recipe.ownerId] && (
                    <Link
                      as={NextLink}
                      href={
                        userProfiles[recipe.ownerId]?.slug
                          ? `/user/${userProfiles[recipe.ownerId]?.slug}`
                          : "#"
                      }
                      _hover={{ textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HStack
                        mt={2}
                        gap={2}
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                      >
                        <Avatar.Root
                          size="xs"
                          colorPalette="teal"
                          variant="solid"
                        >
                          <Avatar.Fallback
                            name={userProfiles[recipe.ownerId]?.displayName}
                          />
                          <Avatar.Image
                            src={
                              userProfiles[recipe.ownerId]?.photoURL ||
                              undefined
                            }
                            alt="User Avatar"
                            borderRadius="full"
                          />
                        </Avatar.Root>

                        <Text fontSize="sm">
                          {userProfiles[recipe.ownerId]?.displayName}
                        </Text>
                      </HStack>
                    </Link>
                  )}

                {recipe.tags && recipe.tags.length > 0 && (
                  <Flex mt={3} wrap="wrap" gap={2}>
                    {recipe.tags.map((tagId) => {
                      const tagObj = tagOptions.find((t) => t.id === tagId);
                      const label =
                        tagObj?.translations[i18n.language] ??
                        tagObj?.translations.en ??
                        tagId;

                      return (
                        <Tag.Root
                          key={tagId}
                          size="md"
                          borderRadius="full"
                          variant="subtle"
                          onClick={(e) => {
                            e.preventDefault(); // prevent navigation
                            !selectedTags.includes(tagId) &&
                              handleTagSelect(tagId);
                          }}
                          cursor="pointer"
                        >
                          <Tag.Label>{label}</Tag.Label>
                        </Tag.Root>
                      );
                    })}
                  </Flex>
                )}
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
