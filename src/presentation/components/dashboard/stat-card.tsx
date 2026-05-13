"use client";

import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: IconType;
  gradient?: string;
  progress?: number;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  gradient = "linear(135deg, brand.500, brand.700)",
  progress,
}: StatCardProps) {
  const changeColor =
    changeType === "positive"
      ? "green.500"
      : changeType === "negative"
      ? "red.500"
      : "gray.500";

  const changeBg =
    changeType === "positive"
      ? "green.50"
      : changeType === "negative"
      ? "red.50"
      : "gray.50";

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={5}
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 20px 40px rgba(124, 58, 237, 0.08)",
      }}
      boxShadow="0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)"
      border="1px"
      borderColor="gray.100"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        right={0}
        w="100px"
        h="100px"
        bgGradient={gradient}
        opacity={0.05}
        borderBottomLeftRadius="full"
      />

      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
            {title}
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.800" mt={1} lineHeight="1">
            {value}
          </Text>
        </Box>
        <Flex
          align="center"
          justify="center"
          w={11}
          h={11}
          borderRadius="xl"
          bgGradient={gradient}
          boxShadow="0 4px 14px rgba(124, 58, 237, 0.25)"
        >
          <Icon as={icon} boxSize={5} color="white" />
        </Flex>
      </Flex>

      {change && (
        <Box
          display="inline-flex"
          px={2.5}
          py={1}
          borderRadius="lg"
          bg={changeBg}
        >
          <Text fontSize="xs" color={changeColor} fontWeight="600">
            {change}
          </Text>
        </Box>
      )}

      {progress !== undefined && (
        <Box mt={3}>
          <Box
            w="full"
            h="4px"
            bg="gray.100"
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              h="full"
              w={`${progress}%`}
              bgGradient={gradient}
              borderRadius="full"
              transition="width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
