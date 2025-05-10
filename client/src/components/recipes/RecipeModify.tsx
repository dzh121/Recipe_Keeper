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
import { useTranslation } from "react-i18next";
import { Tag as TagType } from "@/lib/types/tag";

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
  const [tagOptions, setTagOptions] = useState<TagType[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(
    initialData.imageURL || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const { t, i18n } = useTranslation();
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
          `${process.env.NEXT_PUBLIC_API_URL}/tags`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch tags");
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
          title: t("recipeModify.invalidFile"),
          description: t("recipeModify.invalidFileDescription"),
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
      !selectedTags.includes(tag.id) &&
      (tag.translations[i18n.language] ?? tag.translations.en ?? tag.id)
        .toLowerCase()
        .includes(tagSearch.toLowerCase())
  );

  const validateForm = () => {
    if (!title.trim()) return error(t("recipeModify.missingTitle"));
    if (recipeType === "link" && !link.trim())
      return error(t("recipeModify.missingLink"));
    if (recipeType === "homemade" && !ingredients.trim())
      return error(t("recipeModify.missingIngredients"));
    if (recipeType === "homemade" && !instructions.trim())
      return error(t("recipeModify.missingInstructions"));
    if (!selectedTags.length) return error(t("recipeModify.missingTags"));
    return true;
  };

  const error = (msg: string) => {
    toaster.create({
      title: t("recipeModify.missingInfoTitle"),
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
          ? `${process.env.NEXT_PUBLIC_API_URL}/recipes/${initialData.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/recipes`;
      const method = mode === "edit" ? "PATCH" : "POST";

      if (
        mode === "edit" &&
        !photoFile &&
        initialData.imageURL &&
        !photoPreviewUrl
      ) {
        const deletePhotoUrl = `${process.env.NEXT_PUBLIC_API_URL}/recipes/delete-photo/${initialData.id}`;
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

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/upload-photo`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${authToken}`,
          },
          body: formData,
        });
      }

      toaster.create({
        title: `Recipe ${mode === "edit" ? "Saved" : "Added"}`,
        description:
          mode === "edit"
            ? t("recipeModify.saveSuccessDescription")
            : t("recipeModify.addSuccessDescription"),
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
        title: t("recipeModify.saveFailed"),
        description: t("recipeModify.saveFailedDescription"),
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
    const url = `${process.env.NEXT_PUBLIC_API_URL}/recipes/${initialData.id}`;
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
        title: t("recipeModify.deleteFailed"),
        description: t("recipeModify.deleteFailedDescription"),
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
        {t("recipeModify.photo")}
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
              {t("recipeModify.changePhoto")}
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
                {t("recipeModify.dragPhoto")}
              </Text>
              <Text fontSize="sm" color={placeholderColor} textAlign="center">
                {t("recipeModify.or")}
              </Text>
              <Button
                colorPalette="teal"
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
                _hover={{ bg: "teal.50" }}
              >
                <FiUpload />
                {t("recipeModify.browse")}
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
        {t("recipeModify.addPhoto")}
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
      dir={i18n.language === "he" ? "rtl" : "ltr"}
    >
      <Toaster />
      <VStack gap={8} align="stretch">
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading fontSize="2xl">
              {mode === "edit"
                ? t("recipeModify.editTitle")
                : t("recipeModify.addTitle")}
            </Heading>
            {mode === "edit" && (
              <Dialog.Root role="alertdialog">
                <Dialog.Trigger asChild>
                  <Button colorPalette={"red"} variant="subtle" size="sm">
                    <Icon as={FiX} mr={2} color="red.500" />{" "}
                    {t("common.delete")}
                  </Button>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>{t("common.delete")}</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        <Text fontSize="md" mb={2}>
                          {t("recipeModify.deleteConfirm")}
                        </Text>
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Dialog.ActionTrigger asChild>
                          <Button variant="outline">
                            {t("common.cancel")}
                          </Button>
                        </Dialog.ActionTrigger>
                        <Button colorPalette="red" onClick={handleRemove}>
                          {t("common.delete")}
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

          <Text color="gray.500">{t("recipeModify.subtitle")}</Text>
        </Box>

        {/* Recipe Type Selector */}
        <Tabs.Root
          dir={i18n.language === "he" ? "rtl" : "ltr"}
          colorPalette="teal"
          value={recipeType}
          onValueChange={(e) => setRecipeType(e.value as "link" | "homemade")}
          variant="subtle"
        >
          <Tabs.List mb={4}>
            <Tabs.Trigger value="link">
              <Icon as={FiGlobe} mr={2} />
              {t("recipeModify.recipeLink")}
            </Tabs.Trigger>
            <Tabs.Trigger value="homemade">
              <Icon as={FiHome} mr={2} />
              {t("recipeModify.homemadeRecipe")}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Link Recipe Panel */}
          <Tabs.Content
            value="link"
            p={0}
            dir={i18n.language === "he" ? "rtl" : "ltr"}
          >
            <VStack gap={6} align="stretch">
              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t("recipeModify.title")}{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Input
                  placeholder={t("recipeModify.titlePlaceholder")}
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
                  {t("recipeModify.link")}{" "}
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
                  {t("recipeModify.linkHelp")}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t("recipeModify.notes")}
                </Text>
                <Textarea
                  placeholder={t("recipeModify.notesPlaceholder")}
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
                    {t("recipeModify.timeToFinish")}
                  </Text>
                  <InputGroup startElement={<Icon as={FiClock} />}>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t("recipeModify.minutesPlaceholder")}
                      value={timeToFinish}
                      onChange={(e) => setTimeToFinish(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                  </InputGroup>
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    {t("recipeModify.rating")}
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
                  {t("recipeModify.review")}
                </Text>
                <Textarea
                  placeholder={t("recipeModify.reviewPlaceholder")}
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
                  {t("recipeModify.title")}{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Input
                  placeholder={t("recipeModify.titlePlaceholder")}
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
                    {t("recipeModify.servings")}
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    placeholder={t("recipeModify.servingsPlaceholder")}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    {t("recipeModify.prepTime")}
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    placeholder={t("recipeModify.minutesPlaceholder")}
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    {t("recipeModify.cookTime")}
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    placeholder={t("recipeModify.minutesPlaceholder")}
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    borderColor={borderColor}
                    _focus={{ borderColor: "teal.400" }}
                  />
                </Box>
              </HStack>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t("recipeModify.ingredients")}{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Textarea
                  placeholder={t("recipeModify.ingredientsPlaceholder")}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={6}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {t("recipeModify.ingredientsHelp")}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t("recipeModify.instructions")}{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <Textarea
                  placeholder={t("recipeModify.instructionsPlaceholder")}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  borderColor={borderColor}
                  _focus={{ borderColor: "teal.400" }}
                  rows={8}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {t("recipeModify.instructionsHelp")}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t("recipeModify.notes")}
                </Text>
                <Textarea
                  placeholder={t("recipeModify.notesPlaceholder")}
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
                    {t("recipeModify.timeToFinish")}
                  </Text>
                  <InputGroup startElement={<Icon as={FiClock} />}>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t("recipeModify.timeToFinish")}
                      value={timeToFinish}
                      onChange={(e) => setTimeToFinish(e.target.value)}
                      borderColor={borderColor}
                      _focus={{ borderColor: "teal.400" }}
                    />
                  </InputGroup>
                </Box>

                <Box flex="1">
                  <Text fontWeight="medium" mb={2}>
                    {t("recipeModify.rating")}
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
            {t("recipeModify.tags")}{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>

          {/* Selected Tags Display */}
          <Flex
            wrap="wrap"
            gap={2}
            mb={3}
            dir={i18n.language === "he" ? "ltr" : "rtl"}
          >
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
                  <Tag.Label>
                    {tagOptions.find((t) => t.id === tag)?.translations[
                      i18n.language
                    ] ??
                      tagOptions.find((t) => t.id === tag)?.translations.en ??
                      tag}
                  </Tag.Label>
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
                {t("recipeModify.addTags")}
                <FiChevronDown />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content maxH="250px" overflowY="auto" minW="200px">
                  <Box px={3} py={2}>
                    <Input
                      placeholder={t("recipeModify.searchTags")}
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
                        key={tag.id}
                        value={tag.id}
                        onClick={() => handleAddTag(tag.id)}
                      >
                        {tag.translations[i18n.language] ??
                          tag.translations.en ??
                          tag.id}
                      </Menu.Item>
                    ))
                  ) : (
                    <Box px={3} py={2} textAlign="center" color="gray.500">
                      {t("recipeModify.noTagsFound")}
                    </Box>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
        <Flex
          mt={4}
          justify="space-between"
          direction={i18n.language === "he" ? "row-reverse" : "row"}
          align="center"
          flexWrap="wrap"
          gap={4}
        >
          <HStack>
            <Text fontWeight="medium">{t("recipeModify.public")}</Text>
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

          <Button
            colorPalette="teal"
            onClick={handleSave}
            loading={isSubmitting}
            loadingText={mode === "edit" ? t("common.save") : t("common.add")}
            size="lg"
            px={8}
            borderRadius="md"
            _hover={{ transform: "translateY(-1px)", boxShadow: "sm" }}
          >
            <FiSave />
            {mode === "edit" ? t("common.save") : t("common.add")}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}
