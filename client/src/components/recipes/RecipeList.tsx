"use client";

import {
  Box,
  Heading,
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
  TagLabel,
  Link,
  Select,
  Menu,
  Portal,
  createListCollection,
  Avatar,
  IconButton,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import {
  LuBookOpen,
  LuSearch,
  LuFilter,
  LuPlus,
  LuTag,
  LuChevronDown,
  LuGlobe,
} from "react-icons/lu";
import { MdOutlineEdit, MdOutlineFavorite } from "react-icons/md";
import { FiX } from "react-icons/fi";
import { LuX } from "react-icons/lu";
import NextLink from "next/link";
import { useColorModeValue } from "@/components/ui/color-mode";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type Recipe = {
  id: string;
  title: string;
  isPublic: boolean;
  tags?: string[];
  recipeType?: "link" | "homemade";
  ownerId?: string;
};

type UserProfile = {
  displayName: string;
  photoURL?: string;
};

interface RecipeListProps {
  title: string;
  recipes: Recipe[];
  allowEdit?: boolean;
  showAddButton?: boolean;
  showPublicTag?: boolean;
  showPublisher?: boolean;
  showFavorite?: boolean;
  onAddClick?: () => void;
  onEditClick?: (id: string) => void;
  onFavoriteClick?: (id: string) => void;
}

const recipeTypes = createListCollection({
  items: [
    { label: "All Types", value: "all" },
    { label: "Link Recipes", value: "link" },
    { label: "Homemade Recipes", value: "homemade" },
  ],
});
const recipePublic = createListCollection({
  items: [
    { label: "All", value: "all" },
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
  ],
});

export default function RecipeList({
  title,
  recipes,
  allowEdit = false,
  showAddButton = false,
  showPublicTag = false,
  showPublisher = false,
  showFavorite = false,
  onAddClick,
  onEditClick,
  onFavoriteClick,
}: RecipeListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>(["all"]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [visibilityFilter, setVisibilityFilter] = useState<string[]>(["all"]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/tags", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data = await response.json();
        setTagOptions(data.tags);
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
          ...new Set(recipes.map((recipe) => recipe.ownerId).filter(Boolean)),
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
                photoURL: userData.photoURL || "",
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
  }, [recipes, showPublisher]);
  useEffect(() => {
    console.log("userProfiles", userProfiles);
  }, [userProfiles]);
  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const clearFilters = () => {
    setTypeFilter(["all"]);
    setSelectedTags([]);
    setSearchQuery("");
  };

  const filteredRecipes = recipes.filter((recipe) => {
    // Filter by type
    if (typeFilter[0] !== "all" && recipe.recipeType !== typeFilter[0]) {
      return false;
    }
    if (visibilityFilter[0] !== "all") {
      if (visibilityFilter[0] === "public" && !recipe.isPublic) {
        return false;
      } else if (visibilityFilter[0] === "private" && recipe.isPublic) {
        return false;
      }
    }

    // Filter by search query
    if (
      searchQuery &&
      !recipe.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      if (!recipe.tags) return false;
      return selectedTags.every((tag) => recipe.tags?.includes(tag));
    }

    return true;
  });

  const filteredTags = tagOptions.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(tagSearch.toLowerCase())
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
              Add Recipe
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
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
              fontSize="md"
              height="48px"
              _dark={{ borderColor: "gray.600" }}
            />
          </InputGroup>

          {/* Filters row with improved spacing and styling */}
          <Flex gap={5} flexWrap="wrap" align="center">
            {/* Type filter */}
            <HStack gap={2} minW={{ base: "full", md: "220px" }}>
              <Icon as={LuFilter} color="teal.500" boxSize={5} />
              <Select.Root
                collection={recipeTypes}
                value={typeFilter}
                onValueChange={(e) => setTypeFilter(e.value)}
                variant="outline"
                width="full"
                size="md"
              >
                <Select.HiddenSelect />
                <Select.Label fontWeight="medium">Recipe Type</Select.Label>
                <Select.Control
                  borderWidth="2px"
                  borderColor="gray.300"
                  _hover={{ borderColor: "teal.400" }}
                  height="40px"
                  borderRadius="md"
                  _dark={{ borderColor: "gray.600" }}
                >
                  <Select.Trigger px={3}>
                    <Select.ValueText placeholder="Filter by type" />
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

            {/* Visibility filter */}
            {showPublicTag && (
              <HStack gap={2} minW={{ md: "50px" }}>
                <Icon as={LuGlobe} color="teal.500" boxSize={5} />
                <Select.Root
                  collection={recipePublic}
                  value={visibilityFilter}
                  onValueChange={(e) => setVisibilityFilter(e.value)}
                  width="160px"
                >
                  <Select.Label fontWeight="medium">Visibility</Select.Label>
                  <Select.HiddenSelect />
                  <Select.Control
                    borderWidth="2px"
                    borderColor="gray.300"
                    _hover={{ borderColor: "teal.400" }}
                    height="40px"
                    borderRadius="md"
                    _dark={{ borderColor: "gray.600" }}
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="Visibility" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
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
                            <Select.ItemIndicator />
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
              <VStack gap={1}>
                <Text fontWeight="medium">Tags</Text>
                <Menu.Root closeOnSelect={false}>
                  <Menu.Trigger asChild>
                    <Button
                      size="md"
                      height="40px"
                      variant="outline"
                      borderWidth="2px"
                      borderColor="gray.300"
                      _hover={{ borderColor: "teal.400" }}
                      _dark={{ borderColor: "gray.600" }}
                      px={4}
                      borderRadius="md"
                    >
                      <LuChevronDown />
                      Select Tags
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
                              placeholder="Search tags..."
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
                              key={tag}
                              value={tag}
                              onClick={() => handleTagSelect(tag)}
                              _hover={{
                                bg: "teal.50",
                                _dark: { bg: "teal.900" },
                              }}
                              px={4}
                              py={2}
                            >
                              {tag}
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
                            No tags found
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
                Clear Filters
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
                      {tag}
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
          {filteredRecipes.length}{" "}
          {filteredRecipes.length === 1 ? "recipe" : "recipes"} found
        </Text>
      </HStack>

      {/* Results */}
      {filteredRecipes.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          borderWidth="1px"
          borderRadius="md"
          bg={cardBg}
          borderColor={borderColor}
        >
          <Text fontSize="lg">No recipes found matching your criteria.</Text>
          <Button
            mt={4}
            colorPalette="teal"
            variant="outline"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </Box>
      ) : (
        <VStack align="stretch" gap={4}>
          {filteredRecipes.map((recipe) => (
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
                    <Icon as={LuBookOpen} color="teal.500" />
                    <Text fontWeight="bold" fontSize="lg" color="teal.500">
                      {recipe.title || "Untitled Recipe"}
                    </Text>
                  </HStack>

                  <HStack gap={2}>
                    {showPublicTag && (
                      <Badge
                        colorPalette={recipe.isPublic ? "green" : "gray"}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {recipe.isPublic ? "Public" : "Private"}
                      </Badge>
                    )}

                    <Badge
                      colorPalette={
                        recipe.recipeType === "homemade" ? "orange" : "blue"
                      }
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {recipe.recipeType === "homemade" ? "Homemade" : "Link"}
                    </Badge>

                    {allowEdit && (
                      <Tooltip
                        content="Edit Recipe"
                        positioning={{ placement: "top" }}
                      >
                        <IconButton
                          aria-label="Edit recipe"
                          variant="outline"
                          size="sm"
                          colorPalette="teal"
                          borderRadius="full"
                          onClick={(e) => {
                            e.preventDefault(); // prevent navigation
                            onEditClick?.(recipe.id);
                          }}
                        >
                          <MdOutlineEdit />
                        </IconButton>
                      </Tooltip>
                    )}
                    {showFavorite && (
                      <Tooltip
                        content="Remove from Favorites"
                        positioning={{ placement: "top" }}
                      >
                        <IconButton
                          aria-label="Remove from favorites"
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
                          src={userProfiles[recipe.ownerId]?.photoURL || ""}
                          alt="User Avatar"
                          borderRadius="full"
                        />
                      </Avatar.Root>

                      <Text fontSize="sm">
                        {userProfiles[recipe.ownerId]?.displayName}
                      </Text>
                    </HStack>
                  )}

                {recipe.tags && recipe.tags.length > 0 && (
                  <Flex mt={3} wrap="wrap" gap={2}>
                    {recipe.tags.map((tag) => (
                      <Tag.Root
                        key={tag}
                        size="md"
                        borderRadius="full"
                        variant="subtle"
                        onClick={(e) => {
                          e.preventDefault(); // prevent navigation
                          !selectedTags.includes(tag) && handleTagSelect(tag);
                        }}
                        cursor="pointer"
                      >
                        <Tag.Label>{tag}</Tag.Label>
                      </Tag.Root>
                    ))}
                  </Flex>
                )}
              </Box>
            </Link>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
