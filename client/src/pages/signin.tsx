"use client";

import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  Field,
  Card,
  CardHeader,
  CardBody,
  InputGroup,
  IconButton,
  Icon,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LuEye, LuEyeOff } from "react-icons/lu";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/router";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Head from "next/head";
import { FiHome } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { createSlug } from "@/lib/utils/slug";
import { useColorModeValue } from "@/components/ui/color-mode";

type FormErrors = {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
};

export default function StartPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, authChecked } = useAuth();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  useEffect(() => {
    if (authChecked && user) {
      router.replace("/");
    }
  }, [authChecked, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async () => {
    const errors = {
      email: !form.email ? t("startPage.errors.requiredEmail") : "",
      password: !form.password ? t("startPage.errors.requiredPassword") : "",
    };

    setFormErrors(errors);
    if (!errors.email && !errors.password) {
      try {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        router.replace("/");
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        let message = t("startPage.authErrors.loginFailed");

        if (error?.code?.startsWith("auth/")) {
          switch (error.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
              message = t("startPage.authErrors.invalidCredentials");
              break;
            case "auth/invalid-email":
              message = t("startPage.authErrors.invalidEmail");
              break;
            case "auth/too-many-requests":
              message = t("startPage.authErrors.tooManyRequests");
              break;
            case "auth/user-disabled":
              message = t("startPage.authErrors.userDisabled");
              break;
            case "auth/network-request-failed":
              message = t("startPage.authErrors.internetError");
              break;
            case "auth/internal-error":
              message = t("startPage.authErrors.internalError");
              break;
            case "auth/missing-password":
              message = t("startPage.authErrors.missingPassword");
              break;
            default:
              message =
                error.message || t("startPage.authErrors.unknownErrorLogin");
          }
        }

        toaster.create({
          title: t("startPage.authErrors.loginError"),
          description: message,
          type: "error",
          meta: { closable: true },
        });
        return;
      }
    }
  };
  const handlePasswordResetRequest = () => {
    if (!resetEmail) {
      setResetEmailError(t("startPage.errors.requiredEmail"));
      return;
    }

    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        toaster.create({
          title: t("startPage.authErrors.resetPassword"),
          description: t("startPage.authErrors.resetPasswordSent"),
          type: "success",
          meta: { closable: true },
        });
        setIsResetModalOpen(false);
        setResetEmail("");
        setResetEmailError("");
      })
      .catch((err: unknown) => {
        const error = err as { code?: string; message?: string };
        let message = t("startPage.authErrors.resetPasswordFailed");

        if (error?.code?.startsWith("auth/")) {
          switch (error.code) {
            case "auth/user-not-found":
              message = t("startPage.authErrors.userNotFound");
              break;
            case "auth/invalid-email":
              message = t("startPage.authErrors.invalidEmail");
              break;
            case "auth/network-request-failed":
              message = t("startPage.authErrors.internetError");
              break;
          }
        }

        toaster.create({
          title: t("startPage.authErrors.resetPasswordError"),
          description: message,
          type: "error",
          meta: { closable: true },
        });
      });
  };

  const handleRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const errors = {
      email: !form.email ? t("startPage.errors.requiredEmail") : "",
      password: !form.password ? t("startPage.errors.requiredPassword") : "",
      confirmPassword: !form.confirmPassword
        ? t("startPage.errors.requiredConfirmPassword")
        : form.confirmPassword !== form.password
        ? t("startPage.errors.passwordMismatch")
        : "",
      displayName: !form.displayName
        ? t("startPage.errors.requiredUsername")
        : "",
    };

    setFormErrors(errors);
    if (
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword &&
      !errors.displayName
    ) {
      try {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        //split to public and private user data
        // public user data
        const slug = createSlug(form.displayName);
        const publicUserData = {
          displayName: form.displayName,
          photoURL: null,
          bio: null,
          slug: slug,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        // private user data
        const privateUserData = {
          email: form.email,
          updatedAt: serverTimestamp(),
          darkMode: false,
          language: "en",
        };
        // set user data in firestore one in public and one in private
        const publicRef = doc(
          db,
          "users",
          userCred.user.uid,
          "public",
          "profile"
        );
        const privateRef = doc(
          db,
          "users",
          userCred.user.uid,
          "private",
          "settings"
        );
        const slugRef = doc(db, "slugs", slug);

        await Promise.all([
          setDoc(publicRef, publicUserData),
          setDoc(privateRef, privateUserData),
          setDoc(slugRef, { uid: userCred.user.uid }),
        ]);

        router.replace("/");
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };

        console.error("Registration failed:", error);

        let message = "Registration failed";
        if (error?.code?.startsWith("auth/")) {
          switch (error.code) {
            case "auth/email-already-in-use":
              message = t("startPage.authErrors.emailInUse");
              break;
            case "auth/invalid-email":
              message = t("startPage.authErrors.invalidEmail");
              break;
            case "auth/weak-password":
              message = t("startPage.authErrors.weakPassword");
              break;
            case "auth/too-many-requests":
              message = t("startPage.authErrors.tooManyRequests");
              break;
            case "auth/network-request-failed":
              message = t("startPage.authErrors.internetError");
              break;
            case "auth/internal-error":
              message = t("startPage.authErrors.internalError");
              break;
            default:
              message =
                error.message || t("startPage.authErrors.unknownErrorRegister");
          }
        }

        toaster.create({
          title: t("startPage.authErrors.registrationError"),
          description: message,
          type: "error",
          meta: { closable: true },
        });

        return;
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGuestLogin = () => {
    router.replace("/");
  };

  if (!authChecked || user) return null;

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
        <title>Sign In - Recipe Keeper</title>
        <meta
          name="description"
          content="Log in to your RecipeKeeper account."
        />
        <meta name="robots" content="noindex" />
      </Head>
      <Header />

      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={6}
      >
        <Toaster />
        <Card.Root w="full" maxW="md" borderRadius="xl" shadow="lg" p={6}>
          <CardHeader>
            <VStack gap={4} textAlign="center">
              <Logo />
              <Heading fontSize="3xl">{t("startPage.welcome")}</Heading>
              <Text color="gray.500" _dark={{ color: "gray.400" }}>
                {t("startPage.subtitle")}
              </Text>
              <Stack direction="row" gap={4} w="full">
                <Button
                  variant={isLogin ? "solid" : "outline"}
                  colorPalette="teal"
                  flex={1}
                  onClick={() => setIsLogin(true)}
                >
                  {t("startPage.login")}
                </Button>
                <Button
                  variant={!isLogin ? "solid" : "outline"}
                  colorPalette="teal"
                  flex={1}
                  onClick={() => setIsLogin(false)}
                >
                  {t("startPage.register")}
                </Button>
              </Stack>
            </VStack>
          </CardHeader>

          <CardBody>
            <Stack gap={4}>
              {!isLogin && (
                <Field.Root required invalid={!!formErrors.displayName}>
                  <Field.Label>
                    {t("startPage.username")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    name="displayName"
                    autoComplete="off"
                    placeholder={t("startPage.placeholders.username")}
                    onChange={handleInputChange}
                  />
                  <Field.ErrorText>{formErrors.displayName}</Field.ErrorText>
                </Field.Root>
              )}

              <Field.Root required invalid={!!formErrors.email}>
                <Field.Label>
                  {t("startPage.email")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder={t("startPage.placeholders.email")}
                  onChange={handleInputChange}
                />
                <Field.ErrorText>{formErrors.email}</Field.ErrorText>
              </Field.Root>

              <Field.Root required invalid={!!formErrors.password}>
                <Field.Label>
                  {t("startPage.password")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <InputGroup
                  endElement={
                    <IconButton
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      variant="ghost"
                      onClick={() => setShowPassword((prev) => !prev)}
                      size="sm"
                    >
                      {<Icon as={showPassword ? LuEyeOff : LuEye} />}
                    </IconButton>
                  }
                >
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    placeholder={t("startPage.placeholders.password")}
                    onChange={handleInputChange}
                  />
                </InputGroup>
                <Field.ErrorText>{formErrors.password}</Field.ErrorText>
              </Field.Root>
              {isLogin && (
                <Button
                  variant="outline"
                  size="sm"
                  colorPalette="teal"
                  onClick={() => setIsResetModalOpen(true)}
                >
                  {t("startPage.forgotPassword")}
                </Button>
              )}

              {!isLogin && (
                <Field.Root required invalid={!!formErrors.confirmPassword}>
                  <Field.Label>
                    {t("startPage.confirmPassword")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <InputGroup
                    endElement={
                      <IconButton
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        variant="ghost"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        size="sm"
                      >
                        {<Icon as={showConfirmPassword ? LuEyeOff : LuEye} />}
                      </IconButton>
                    }
                  >
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="off"
                      placeholder={t("startPage.placeholders.confirmPassword")}
                      onChange={handleInputChange}
                    />
                  </InputGroup>
                  <Field.ErrorText>
                    {formErrors.confirmPassword}
                  </Field.ErrorText>
                </Field.Root>
              )}

              <Button
                w="full"
                colorPalette="teal"
                onClick={() =>
                  void (isLogin ? handleLogin() : handleRegister())
                }
                disabled={isSubmitting}
                mt={2}
              >
                {isLogin ? t("startPage.login") : t("startPage.register")}
              </Button>
              <Button
                variant="ghost"
                colorPalette="teal"
                onClick={handleGuestLogin}
              >
                <FiHome />
                {t("startPage.goHome")}
              </Button>
            </Stack>
          </CardBody>
        </Card.Root>
      </Box>
      {isResetModalOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
          px={4}
        >
          <Card.Root
            w="full"
            maxW="md"
            borderRadius="xl"
            shadow="2xl"
            bg="white"
            _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            border="1px solid"
            borderColor="gray.200"
          >
            <CardHeader pb={4}>
              <VStack gap={2} textAlign="center">
                <Heading size="lg" color="gray.800" _dark={{ color: "white" }}>
                  {t("startPage.resetPassword")}
                </Heading>
                <Text
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  fontSize="sm"
                  maxW="sm"
                >
                  {t("startPage.resetPasswordInstructions")}
                </Text>
              </VStack>
            </CardHeader>

            <CardBody pt={0}>
              <VStack gap={4}>
                <Field.Root required invalid={!!resetEmailError}>
                  <Field.Label>
                    {t("startPage.email")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="email"
                    placeholder={t("startPage.placeholders.email")}
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetEmailError("");
                    }}
                    size="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                  />
                  <Field.ErrorText>{resetEmailError}</Field.ErrorText>
                </Field.Root>

                <Stack direction="row" gap={3} w="full" mt={2}>
                  <Button
                    flex={1}
                    colorPalette="teal"
                    onClick={handlePasswordResetRequest}
                    size="md"
                  >
                    {t("startPage.sendResetLink")}
                  </Button>
                  <Button
                    variant="outline"
                    flex={1}
                    onClick={() => {
                      setIsResetModalOpen(false);
                      setResetEmail("");
                      setResetEmailError("");
                    }}
                    size="md"
                    colorPalette="gray"
                    _dark={{ color: "gray.400", borderColor: "gray.700" }}
                  >
                    {t("startPage.cancel")}
                  </Button>
                </Stack>
              </VStack>
            </CardBody>
          </Card.Root>
        </Box>
      )}
      <Footer />
    </Box>
  );
}
