"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "@/presentation/providers/auth-context";

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(to-br, white, purple.50, purple.100)"
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        borderRadius="2xl"
        boxShadow="0 20px 60px rgba(128, 90, 213, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)"
        p={{ base: 8, md: 10 }}
        w={{ base: "90%", sm: "420px" }}
        maxW="420px"
        transition="transform 0.2s ease, box-shadow 0.2s ease"
        _hover={{
          transform: "translateY(-2px)",
          boxShadow: "0 24px 70px rgba(128, 90, 213, 0.16), 0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={1}>
            <Box
              w={12}
              h={12}
              borderRadius="xl"
              bgGradient="linear(to-br, purple.500, purple.600)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={2}
            >
              <Text fontSize="xl" fontWeight="900" color="white">
                U
              </Text>
            </Box>
            <Text fontSize="xl" fontWeight="800" color="gray.800">
              Universal Dashboard
            </Text>
            <Text fontSize="sm" color="gray.400">
              Sign in to your admin account
            </Text>
          </VStack>

          <VStack spacing={4}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" h="full">
                <Icon as={MdEmail} color="gray.400" boxSize={5} />
              </InputLeftElement>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                borderRadius="xl"
                borderColor="gray.200"
                bg="gray.50"
                _hover={{ borderColor: "purple.300" }}
                _focus={{
                  borderColor: "purple.500",
                  boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)",
                  bg: "white",
                }}
                fontSize="sm"
              />
            </InputGroup>

            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none" h="full">
                <Icon as={MdLock} color="gray.400" boxSize={5} />
              </InputLeftElement>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                borderRadius="xl"
                borderColor="gray.200"
                bg="gray.50"
                _hover={{ borderColor: "purple.300" }}
                _focus={{
                  borderColor: "purple.500",
                  boxShadow: "0 0 0 1px var(--chakra-colors-purple-500)",
                  bg: "white",
                }}
                fontSize="sm"
              />
              <InputRightElement h="full">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  variant="ghost"
                  color="gray.400"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  _hover={{ color: "purple.500" }}
                />
              </InputRightElement>
            </InputGroup>
          </VStack>

          {error && (
            <Text fontSize="sm" color="red.500" textAlign="center">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            size="lg"
            bgGradient="linear(to-r, purple.500, purple.600)"
            color="white"
            borderRadius="xl"
            fontWeight="700"
            fontSize="sm"
            isLoading={isSubmitting}
            loadingText="Signing in..."
            _hover={{
              bgGradient: "linear(to-r, purple.600, purple.700)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 15px rgba(128, 90, 213, 0.4)",
            }}
            _active={{
              transform: "translateY(0)",
            }}
            transition="all 0.2s ease"
          >
            Sign In
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
