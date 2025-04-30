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
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/router";
import { toaster, Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Head from "next/head";
import { FiHome } from "react-icons/fi";
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
  const router = useRouter();

  useEffect(() => {
    if (authChecked && user) {
      router.replace("/");
    }
  }, [authChecked, user, router]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async () => {
    const errors = {
      email: !form.email ? "Email is required" : "",
      password: !form.password ? "Password is required" : "",
    };

    setFormErrors(errors);
    if (!errors.email && !errors.password) {
      try {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        router.replace("/");
      } catch (err: any) {
        let message = "Login failed";

        if (err?.code?.startsWith("auth/")) {
          switch (err.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
              message = "Invalid email or password.";
              break;
            case "auth/invalid-email":
              message = "The email address format is invalid.";
              break;
            case "auth/too-many-requests":
              message =
                "Too many failed attempts. Please wait a few minutes and try again.";
              break;
            case "auth/user-disabled":
              message =
                "This account has been disabled by an administrator. Please contact support.";
              break;
            case "auth/network-request-failed":
              message =
                "Network error. Please check your internet connection and try again.";
              break;
            case "auth/internal-error":
              message = "Internal error. Please try again shortly.";
              break;
            case "auth/missing-password":
              message = "Password is required.";
              break;
            default:
              message = err.message || "Unable to sign in. Please try again.";
          }
        }

        toaster.create({
          title: "Authentication Error",
          description: message,
          type: "error",
          meta: { closable: true },
        });
        return;
      }
    }
  };

  const handleRegister = async () => {
    const errors = {
      email: !form.email ? "Email is required" : "",
      password: !form.password ? "Password is required" : "",
      confirmPassword: !form.confirmPassword
        ? "Confirm your password"
        : form.confirmPassword !== form.password
        ? "Passwords do not match"
        : "",
      displayName: !form.displayName ? "Display name is required" : "",
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
        const publicUserData = {
          displayName: form.displayName,
          photoURL: null,
          recipesPublished: 0,
          bio: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        // private user data
        const privateUserData = {
          email: form.email,
          updatedAt: serverTimestamp(),
          darkMode: false,
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
        await setDoc(publicRef, publicUserData);
        await setDoc(privateRef, privateUserData);

        router.replace("/");
      } catch (err: any) {
        console.error("Registration failed:", err);

        let message = "Registration failed";
        if (err?.code?.startsWith("auth/")) {
          switch (err.code) {
            case "auth/email-already-in-use":
              message = "Email is already in use. Try logging in instead.";
              break;
            case "auth/invalid-email":
              message = "The email address is not valid.";
              break;
            case "auth/weak-password":
              message =
                "Password is too weak. It must be at least 6 characters.";
              break;
            case "auth/too-many-requests":
              message =
                "Too many requests. Please wait a few minutes before trying again.";
              break;
            case "auth/network-request-failed":
              message =
                "Network error. Check your internet connection and try again.";
              break;
            case "auth/internal-error":
              message = "Internal error. Please try again later.";
              break;
            default:
              message = err.message || "Registration failed. Please try again.";
          }
        }

        toaster.create({
          title: "Registration Error",
          description: message,
          type: "error",
          meta: { closable: true },
        });

        return;
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
        <title>Sign In - RecipeKeeper</title>
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
              <Heading fontSize="3xl">Welcome to RecipeKeeper</Heading>
              <Text color="gray.500" _dark={{ color: "gray.400" }}>
                Access your personal recipe vault
              </Text>
              <Stack direction="row" gap={4} w="full">
                <Button
                  variant={isLogin ? "solid" : "outline"}
                  colorPalette="teal"
                  flex={1}
                  onClick={() => setIsLogin(true)}
                >
                  Log In
                </Button>
                <Button
                  variant={!isLogin ? "solid" : "outline"}
                  colorPalette="teal"
                  flex={1}
                  onClick={() => setIsLogin(false)}
                >
                  Register
                </Button>
              </Stack>
            </VStack>
          </CardHeader>

          <CardBody>
            <Stack gap={4}>
              {!isLogin && (
                <Field.Root required invalid={!!formErrors.displayName}>
                  <Field.Label>
                    Username
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    name="displayName"
                    autoComplete="off"
                    placeholder="Enter your username"
                    onChange={handleInputChange}
                  />
                  <Field.ErrorText>{formErrors.displayName}</Field.ErrorText>
                </Field.Root>
              )}

              <Field.Root required invalid={!!formErrors.email}>
                <Field.Label>
                  Email
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder="you@example.com"
                  onChange={handleInputChange}
                />
                <Field.ErrorText>{formErrors.email}</Field.ErrorText>
              </Field.Root>

              <Field.Root required invalid={!!formErrors.password}>
                <Field.Label>
                  Password
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
                    placeholder="Enter password"
                    onChange={handleInputChange}
                  />
                </InputGroup>
                <Field.ErrorText>{formErrors.password}</Field.ErrorText>
              </Field.Root>

              {!isLogin && (
                <Field.Root required invalid={!!formErrors.confirmPassword}>
                  <Field.Label>
                    Confirm Password
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
                      placeholder="Confirm password"
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
                mt={2}
              >
                {isLogin ? "Log In" : "Register"}
              </Button>
              <Button
                variant="ghost"
                colorPalette="teal"
                onClick={handleGuestLogin}
              >
                <FiHome />
                Go Home
              </Button>
            </Stack>
          </CardBody>
        </Card.Root>
      </Box>
      <Footer />
    </Box>
  );
}
