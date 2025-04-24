"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Link,
  Spinner,
  HStack,
  Select,
  Icon,
  Badge,
  createListCollection,
  Button,
  Input,
  InputGroup,
  Portal,
  Tag,
  TagLabel,
  Flex,
  Menu,
} from "@chakra-ui/react";
import {
  LuBookOpen,
  LuFilter,
  LuSearch,
  LuTag,
  LuPlus,
  LuChevronDown,
  LuX,
} from "react-icons/lu";
import { FiX } from "react-icons/fi";
import NextLink from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useColorModeValue } from "@/components/ui/color-mode";
import { useRouter } from "next/router";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuth } from "@/context/AuthContext";

interface Recipe {
  id: string;
  title: string;
  isPublic: boolean;
  tags?: string[];
  recipeType?: "link" | "homemade";
}
import Head from "next/head";

export default function RecipesIndexPage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string[]>(["all"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const { user } = useAuth();
  const isAuthenticated = !!user;
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const q = query(
          collection(db, "recipes"),
          where("isPublic", "==", true)
        );
        const snapshot = await getDocs(q);
        const result: Recipe[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Recipe, "id">),
        }));
        setRecipes(result);

        // Extract all unique tags
        const tags = new Set<string>();
        result.forEach((recipe) => {
          recipe.tags?.forEach((tag) => tags.add(tag));
        });
        setAllTags(Array.from(tags).sort());
      } catch (err) {
        console.error("Error fetching recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleAddRecipe = () => {
    router.push("/recipes/add");
  };

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

  const filteredTags = allTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const recipeTypes = createListCollection({
    items: [
      { label: "All Types", value: "all" },
      { label: "Link Recipes", value: "link" },
      { label: "Homemade Recipes", value: "homemade" },
    ],
  });
  if (!hasMounted) {
    return null;
  }
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Head>
        <title>Public Recipes</title>
        <meta name="description" content="Explore public recipes" />
        <meta name="robots" content="index, follow" />
      </Head>
      <Header />
      <Container maxW="container.md" py={10} flex="1">
        <VStack align="stretch" gap={8}>
          {/* Enhanced page header with add button */}
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
                <Box position="relative">
                  <Text
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="bold"
                    color={textColor}
                    letterSpacing="tight"
                    lineHeight="1.2"
                    pb={2}
                  >
                    Explore Public Recipes
                    <Box
                      position="absolute"
                      bottom="0"
                      left="0"
                      width="100%"
                      height="3px"
                      bg="teal.500"
                      borderRadius="full"
                    />
                  </Text>
                </Box>
              </Flex>
              {isAuthenticated && (
                <Button
                  colorScheme="teal"
                  onClick={handleAddRecipe}
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
                startElement={
                  <Icon as={LuSearch} color="teal.500" boxSize={5} />
                }
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

                {/* Tag filter */}
                <HStack gap={2} flex="1">
                  <Icon as={LuTag} color="teal.500" boxSize={5} />
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
                        Tags
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
                      colorScheme="teal"
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
          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="lg" color="teal.500" />
            </Box>
          ) : filteredRecipes.length === 0 ? (
            <Box
              textAlign="center"
              py={10}
              borderWidth="1px"
              borderRadius="md"
              bg={cardBg}
              borderColor={borderColor}
            >
              <Text fontSize="lg">
                No recipes found matching your criteria.
              </Text>
              <Button
                mt={4}
                colorScheme="teal"
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
                >
                  <Box
                    key={recipe.id}
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
                      <Badge
                        colorScheme={
                          recipe.recipeType === "homemade" ? "purple" : "blue"
                        }
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {recipe.recipeType === "homemade" ? "Homemade" : "Link"}
                      </Badge>
                    </HStack>

                    {recipe.tags && recipe.tags.length > 0 && (
                      <Flex mt={3} wrap="wrap" gap={2}>
                        {recipe.tags.map((tag) => (
                          <Tag.Root
                            key={tag}
                            size="sm"
                            colorScheme="teal"
                            borderRadius="full"
                            variant="subtle"
                            onClick={(e) => {
                              e.preventDefault(); // prevent navigation
                              !selectedTags.includes(tag) &&
                                handleTagSelect(tag);
                            }}
                            cursor="pointer"
                          >
                            <TagLabel>{tag}</TagLabel>
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
      </Container>
      <Footer />
    </Box>
  );
}
