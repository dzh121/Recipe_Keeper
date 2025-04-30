"use client";

import { useState, useEffect } from "react";
import {
  FiLink,
  FiSave,
  FiClock,
  FiX,
  FiChevronDown,
  FiTag,
  FiHome,
  FiGlobe,
  FiImage,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";
import {
  Box,
  Heading,
  Text,
  VStack,
  Input,
  Textarea,
  Button,
  Flex,
  Icon,
  HStack,
  InputGroup,
  Portal,
  Dialog,
  CloseButton,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { toaster, Toaster } from "@/components/ui/toaster";
import { Switch, Tag, Menu, Tabs } from "@chakra-ui/react";
import { auth } from "@/lib/firebase";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useRouter } from "next/router";
import { RecipeFull } from "@/lib/types/recipe";

export default function RecipeModify({
  mode = "add",
  initialData = {},
}: {
  mode?: "add" | "edit";
  initialData?: Partial<RecipeFull>;
}) {
  const router = useRouter();
  const [recipeType, setRecipeType] = useState<"link" | "homemade">("link");
  const [link, setLink] = useState(initialData.link || "");
  const [title, setTitle] = useState(initialData.title || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [isPublic, setIsPublic] = useState(initialData.isPublic || false);
  const [selectedTags, setSelectedTags] = useState(initialData.tags || []);
  const [tagSearch, setTagSearch] = useState("");
  const [review, setReview] = useState(initialData.review || "");
  const [timeToFinish, setTimeToFinish] = useState(
    initialData.timeToFinish || ""
  );
  const [rating, setRating] = useState(initialData.rating || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ingredients, setIngredients] = useState(initialData.ingredients || "");
  const [instructions, setInstructions] = useState(
    initialData.instructions || ""
  );
  const [servings, setServings] = useState(initialData.servings || "");
  const [prepTime, setPrepTime] = useState(initialData.prepTime || "");
  const [cookTime, setCookTime] = useState(initialData.cookTime || "");
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(
    initialData.imageURL || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const hasMounted = useHasMounted();

  // Colors for theming
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");
  const dropzoneBg = useColorModeValue("gray.50", "gray.700");
  const hoverBorderColor = "teal.400";
  const textColor = useColorModeValue("gray.600", "gray.300");
  const placeholderColor = useColorModeValue("gray.400", "gray.500");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tags`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data = await response.json();
        setTagOptions(
          data.tags.sort((a: string, b: string) => a.localeCompare(b))
        );
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    if (mode === "edit" && initialData && Object.keys(initialData).length > 0) {
      setTitle(initialData.title || "");
      setLink(initialData.link || "");
      setNotes(initialData.notes || "");
      setIsPublic(initialData.isPublic || false);
      setSelectedTags(initialData.tags || []);
      setReview(initialData.review || "");
      setTimeToFinish(initialData.timeToFinish?.toString() || "");
      setRating(initialData.rating || 1);
      setIngredients(initialData.ingredients || "");
      setInstructions(initialData.instructions || "");
      setServings(initialData.servings?.toString() || "");
      setPrepTime(initialData.prepTime?.toString() || "");
      setCookTime(initialData.cookTime?.toString() || "");
      setPhotoPreviewUrl(initialData.imageURL || null);

      if (
        initialData.recipeType === "homemade" ||
        initialData.recipeType === "link"
      ) {
        setRecipeType(initialData.recipeType);
      }
    }
  }, [initialData?.id, mode]);

  const handleDragEnter = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setPhotoFile(file);
        setPhotoPreviewUrl(URL.createObjectURL(file));
      } else {
        toaster.create({
          title: "Invalid File",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          type: "error",
          duration: 3000,
        });
      }
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
    setTagSearch("");
  };

  const handleRemoveTag = (tag: string) =>
    setSelectedTags(selectedTags.filter((t) => t !== tag));

  const filteredTags = tagOptions.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const validateForm = () => {
    if (!title.trim())
      return error("Please enter a recipe title before saving.");
    if (recipeType === "link" && !link.trim())
      return error("Please enter a recipe link before saving.");
    if (recipeType === "homemade" && !ingredients.trim())
      return error("Please enter ingredients for your homemade recipe.");
    if (recipeType === "homemade" && !instructions.trim())
      return error("Please enter instructions for your homemade recipe.");
    if (!selectedTags.length)
      return error("Please select at least one tag before saving.");
    return true;
  };

  const error = (msg: string) => {
    toaster.create({
      title: "Missing information",
      description: msg,
      type: "error",
      duration: 3000,
      meta: { closable: true },
    });
    return false;
  };

  const handleSave = async () => {
    let didFail = false;
    let recipeId = null;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const authToken = await auth.currentUser?.getIdToken();
      const payload = {
        title,
        notes,
        isPublic,
        tags: selectedTags,
        review,
        timeToFinish: Number(timeToFinish) || null,
        rating: Number(rating),
        recipeType,
        ...(recipeType === "link" ? { link } : {}),
        ...(recipeType === "homemade"
          ? {
              ingredients,
              instructions,
              servings: Number(servings) || null,
              prepTime: Number(prepTime) || null,
              cookTime: Number(cookTime) || null,
            }
          : {}),
      };
      const url =
        mode === "edit"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/recipes/${initialData.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/recipes`;
      const method = mode === "edit" ? "PATCH" : "POST";

      if (
        mode === "edit" &&
        !photoFile &&
        initialData.imageURL &&
        !photoPreviewUrl
      ) {
        const deletePhotoUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/recipes/delete-photo/${initialData.id}`;
        await fetch(deletePhotoUrl, {
          method: "DELETE",
          headers: {
            authorization: `Bearer ${authToken}`,
          },
        });
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        didFail = true;
        throw new Error("Save failed");
      }
      const data = await response.json();
      recipeId = data.id || initialData.id;
      if (photoFile && recipeId) {
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("recipeId", recipeId);

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/recipes/upload-photo`,
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${authToken}`,
            },
            body: formData,
          }
        );
      }

      toaster.create({
        title: `Recipe ${mode === "edit" ? "Saved" : "Added"}`,
        description: `Your recipe was successfully ${
          mode === "edit" ? "updated" : "added"
        }.`,
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });

      if (mode === "add") {
        setTitle("");
        setLink("");
        setNotes("");
        setIsPublic(false);
        setSelectedTags([]);
        setTagSearch("");
        setReview("");
        setTimeToFinish("");
        setRating(1);
        setIngredients("");
        setInstructions("");
        setServings("");
        setPrepTime("");
        setCookTime("");
        setPhotoFile(null);
        setPhotoPreviewUrl(null);
      }
    } catch (err) {
      toaster.create({
        title: "Save Failed",
        description: "An error occurred.",
        type: "error",
        duration: 4000,
        meta: { closable: true },
      });
      didFail = true;
    } finally {
      if (!didFail) {
        if (mode === "add") {
          // Redirect to the new recipe page
          router.push(`/recipes/${recipeId}`);
        } else {
          // Redirect to the edited recipe page
          router.replace(`/recipes/${recipeId}`);
        }
      }
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (mode !== "edit") return;
    const authToken = await auth.currentUser?.getIdToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/recipes/${initialData.id}`;
    const method = "DELETE";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");

      toaster.create({
        title: "Recipe Deleted",
        description: "Your recipe was successfully deleted.",
        type: "success",
        duration: 3000,
        meta: { closable: true },
      });
      router.push("/recipes/manage");
    } catch (err) {
      toaster.create({
        title: "Delete Failed",
        description: "An error occurred.",
        type: "error",
        duration: 4000,
        meta: { closable: true },
      });
    }
  };

  // Photo Upload Component
  const PhotoUploadComponent = () => (
    <Box mb={6}>
      <Text fontWeight="medium" mb={2}>
        Recipe Photo
      </Text>
      <Flex
        direction="column"
        align="center"
        justify="center"
        border="2px dashed"
        borderColor={
          isDragging
            ? hoverBorderColor
            : photoPreviewUrl
            ? hoverBorderColor
            : borderColor
        }
        borderRadius="lg"
        p={6}
        bg={dropzoneBg}
        transition="all 0.3s ease"
        height={photoPreviewUrl ? "auto" : "200px"}
        _hover={{ borderColor: hoverBorderColor, boxShadow: "sm" }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        position="relative"
      >
        {photoPreviewUrl ? (
          <Flex direction="column" align="center" width="100%">
            <Box
              position="relative"
              width="100%"
              maxWidth="400px"
              mb={4}
              borderRadius="md"
              overflow="hidden"
              boxShadow="md"
            >
              <img
                src={photoPreviewUrl}
                alt="Recipe Preview"
                style={{
                  width: "100%",
                  maxHeight: "280px",
                  objectFit: "cover",
                }}
              />
              <Button
                size="sm"
                colorPalette="red"
                position="absolute"
                top={2}
                right={2}
                borderRadius="full"
                width="32px"
                height="32px"
                minWidth="32px"
                padding={0}
                onClick={handleRemovePhoto}
              >
                <FiTrash2 />
              </Button>
            </Box>
            <Button
              size="sm"
              colorPalette="teal"
              variant="outline"
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <FiUpload />
              Change Photo
            </Button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </Flex>
        ) : (
          <>
            <VStack gap={3}>
              <Icon as={FiImage} fontSize="3xl" color={placeholderColor} />
              <Text textAlign="center" color={textColor} fontWeight="medium">
                Drag and drop an image here
              </Text>
              <Text fontSize="sm" color={placeholderColor} textAlign="center">
                or
              </Text>
              <Button
                colorPalette="teal"
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
                _hover={{ bg: "teal.50" }}
              >
                <FiUpload />
                Browse Files
              </Button>
            </VStack>
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileChange}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </>
        )}
      </Flex>
      <Text fontSize="sm" color="gray.500" mt={2}>
        Add a photo of your finished recipe. JPEG or PNG recommended.
      </Text>
    </Box>
  );

  if (!hasMounted) return null;

  return (
    <Box
      boxShadow="md"
      borderRadius="lg"
      p={6}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Toaster />
      <VStack gap={8} align="stretch">
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading fontSize="2xl">
              {mode === "edit" ? "Edit" : "Add"} Recipe
            </Heading>
            {mode === "edit" && (
              <Dialog.Root role="alertdialog">
                <Dialog.Trigger asChild>
                  <Button colorPalette={"red"} variant="subtle" size="sm">
                    <Icon as={FiX} mr={2} color="red.500" /> Delete Recipe
                  </Button>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>Delete Recipe</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        <Text fontSize="md" mb={2}>
                          Are you sure you want to delete this recipe?
                        </Text>
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </Dialog.ActionTrigger>
                        <Button colorPalette="red" onClick={handleRemove}>
                          Delete
                        </Button>
                      </Dialog.Footer>
                      <Dialog.CloseTrigger asChild>
                        <CloseButton size="md" />
                      </Dialog.CloseTrigger>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Portal>
              </Dialog.Root>
            )}
          </Flex>

          <Text color="gray.500">
            Save your favorite recipes and customize them with notes and tags.
          </Text>
        </Box>

        {/* Recipe Type Selector */}
        <Tabs.Root
          colorPalette="teal"
          value={recipeType}
          onValueChange={(e) => setRecipeType(e.value as "link" | "homemade")}
          variant="subtle"
        >
          <Tabs.List mb={4}>
            <Tabs.Trigger value="link">
              <Icon as={FiGlobe} mr={2} />
              Recipe Link
            </Tabs.Trigger>
            <Tabs.Trigger value="homemade">
              <Icon as={FiHome} mr={2} />
              Homemade Recipe
            </Tabs.Trigger>
          </Tabs.List>

          {/* Link Recipe Panel */}
          <Tabs.Content value="link" p={0}>
            <VStack gap={6} align="stretch">
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Recipe Title{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Input
                  placeholder="e.g. Chocolate Chip Cookies"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                />
              </Box>

              {/* Photo Upload Component */}
              <PhotoUploadComponent />

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Recipe Link{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <InputGroup
                  startElement={<Icon as={FiLink} color="gray.400" />}
                >
                  <Input
                    type="url"
                    placeholder="https://example.com/my-favorite-recipe"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </InputGroup>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enter the URL of the recipe you'd like to save
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Notes
                </Text>
                <Textarea
                  placeholder="Why you like it, changes you'd make, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={4}
                />
              </Box>

              <HStack gap={6} align="flex-start">
                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Time to Finish
                  </Text>
                  <InputGroup startElement={<Icon as={FiClock} />}>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Minutes"
                      value={timeToFinish}
                      onChange={(e) => setTimeToFinish(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                  </InputGroup>
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Rating
                  </Text>
                  <HStack gap={2}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Box
                        key={star}
                        as="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        color={
                          hoveredRating > 0
                            ? star <= hoveredRating
                              ? "yellow.300"
                              : "gray.300"
                            : star <= rating
                            ? "yellow.400"
                            : "gray.300"
                        }
                        fontSize="2xl"
                        cursor="pointer"
                        transition="color 0.2s"
                      >
                        ★
                      </Box>
                    ))}
                  </HStack>
                </Box>
              </HStack>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Your Review
                </Text>
                <Textarea
                  placeholder="How was it? Would you make it again?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={3}
                />
              </Box>
            </VStack>
          </Tabs.Content>

          {/* Homemade Recipe Panel */}
          <Tabs.Content value="homemade" p={0}>
            <VStack gap={6} align="stretch">
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Recipe Title{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Input
                  placeholder="e.g. Apple Pie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                />
              </Box>

              {/* Photo Upload Component */}
              <PhotoUploadComponent />

              <HStack gap={6} align="flex-start">
                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Servings
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Number of servings"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Prep Time (min)
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Minutes"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Cook Time (min)
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Minutes"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </Box>
              </HStack>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Ingredients{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Textarea
                  placeholder="List ingredients line by line, e.g.:
2 cups flour
1 cup sugar
1/2 cup butter"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={6}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Enter each ingredient on a new line with quantities
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Instructions{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Textarea
                  placeholder="List steps in order, e.g.:
1. Preheat oven to 350°F
2. Mix dry ingredients
3. Add wet ingredients and stir until combined"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={8}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Number your steps or separate them with line breaks
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  Notes
                </Text>
                <Textarea
                  placeholder="Special tips, variations, or personal notes about this recipe"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={4}
                />
              </Box>

              <HStack gap={6} align="flex-start">
                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Time to Finish
                  </Text>
                  <InputGroup startElement={<Icon as={FiClock} />}>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Total minutes (incl. prep)"
                      value={timeToFinish}
                      onChange={(e) => setTimeToFinish(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                  </InputGroup>
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    Rating
                  </Text>
                  <HStack gap={2}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Box
                        key={star}
                        as="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        color={
                          hoveredRating > 0
                            ? star <= hoveredRating
                              ? "yellow.300"
                              : "gray.300"
                            : star <= rating
                            ? "yellow.400"
                            : "gray.300"
                        }
                        fontSize="2xl"
                        cursor="pointer"
                        transition="color 0.2s"
                      >
                        ★
                      </Box>
                    ))}
                  </HStack>
                </Box>
              </HStack>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>

        {/* Common elements for both recipe types */}
        <Box>
          <Text fontWeight="medium" mb={3}>
            Tags{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>

          {/* Selected Tags Display */}
          <Flex wrap="wrap" gap={2} mb={3}>
            {selectedTags.map((tag) => (
              <Tag.Root
                asChild
                key={tag}
                size="md"
                variant="solid"
                colorPalette="teal"
                borderRadius="full"
                py={1}
                px={3}
              >
                <button
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemoveTag(tag)}
                >
                  <Tag.Label>{tag} </Tag.Label>
                  <FiX />
                </button>
              </Tag.Root>
            ))}
          </Flex>

          {/* Tag Dropdown with correct Chakra UI Menu structure */}
          <Menu.Root closeOnSelect={false}>
            <Menu.Trigger asChild>
              <Button size="sm" colorPalette="teal" variant="outline">
                <Icon as={FiTag} />
                Add Tags
                <FiChevronDown />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content maxH="250px" overflowY="auto" minW="200px">
                  <Box px={3} py={2}>
                    <Input
                      placeholder="Search tags..."
                      size="sm"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                  </Box>

                  {filteredTags.length > 0 ? (
                    filteredTags.map((tag) => (
                      <Menu.Item
                        key={tag}
                        value={tag}
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </Menu.Item>
                    ))
                  ) : (
                    <Box px={3} py={2} textAlign="center" color="gray.500">
                      No tags found
                    </Box>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
        <HStack justify="space-between">
          <Text></Text>
          <HStack>
            <Text fontWeight="medium">Public</Text>
            <Switch.Root
              colorPalette="teal"
              checked={isPublic}
              onCheckedChange={(e) => setIsPublic(e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control
                bg={isPublic ? "teal.500" : "gray.300"}
                borderRadius="full"
              >
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </HStack>

        <Flex justify="flex-end" mt={4}>
          <Button
            colorPalette="teal"
            onClick={handleSave}
            loading={isSubmitting}
            loadingText={mode === "edit" ? "Saving" : "Adding"}
            size="lg"
            px={8}
            borderRadius="md"
            _hover={{ transform: "translateY(-1px)", boxShadow: "sm" }}
          >
            <FiSave />
            {mode === "edit" ? "Save" : "Add"}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}
