"use client";

import { Box, Flex, Text, HStack, Badge } from "@chakra-ui/react";

interface StationData {
  name: string;
  level: number;
  maxLevel: number;
  status: "normal" | "warning" | "danger";
}

const stations: StationData[] = [
  { name: "Station A - Yamuna", level: 8.2, maxLevel: 12, status: "warning" },
  { name: "Station B - Ganga", level: 5.4, maxLevel: 15, status: "normal" },
  { name: "Station C - Brahmaputra", level: 11.8, maxLevel: 14, status: "danger" },
  { name: "Station D - Godavari", level: 3.2, maxLevel: 10, status: "normal" },
  { name: "Station E - Krishna", level: 7.1, maxLevel: 9, status: "warning" },
];

const statusConfig = {
  normal: { color: "green.500", bg: "green.50", gradient: "linear(to-r, green.400, green.500)", badge: "green" },
  warning: { color: "orange.500", bg: "orange.50", gradient: "linear(to-r, orange.400, orange.500)", badge: "orange" },
  danger: { color: "red.500", bg: "red.50", gradient: "linear(to-r, red.400, red.500)", badge: "red" },
};

export function WaterLevelChart() {
  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      p={5}
      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
    >
      <Flex justify="space-between" align="center" mb={5}>
        <Flex align="center" gap={2}>
          <Box w="3px" h="18px" bgGradient="linear(to-b, brand.400, brand.600)" borderRadius="full" />
          <Text fontSize="md" fontWeight="700" color="gray.800">
            Water Level Monitor
          </Text>
        </Flex>
        <HStack spacing={1.5}>
          {(["normal", "warning", "danger"] as const).map((status) => (
            <Badge
              key={status}
              bg={statusConfig[status].bg}
              color={statusConfig[status].color}
              fontSize="xs"
              borderRadius="lg"
              px={2}
              py={0.5}
              fontWeight="600"
              textTransform="capitalize"
            >
              {status}
            </Badge>
          ))}
        </HStack>
      </Flex>

      <Flex direction="column" gap={4}>
        {stations.map((station) => {
          const percentage = (station.level / station.maxLevel) * 100;
          const config = statusConfig[station.status];
          return (
            <Box
              key={station.name}
              p={3}
              borderRadius="xl"
              bg="gray.50"
              _hover={{ bg: config.bg }}
              transition="all 0.15s"
            >
              <Flex justify="space-between" mb={2} align="center">
                <Text fontSize="sm" color="gray.700" fontWeight="600">
                  {station.name}
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.500" fontWeight="500">
                    <Text as="span" fontWeight="700" color={config.color}>
                      {station.level}m
                    </Text>
                    {" "}/ {station.maxLevel}m
                  </Text>
                  <Badge
                    bg={config.bg}
                    color={config.color}
                    fontSize="xs"
                    borderRadius="lg"
                    px={2}
                    fontWeight="600"
                    textTransform="capitalize"
                  >
                    {station.status}
                  </Badge>
                </HStack>
              </Flex>
              <Box
                w="full"
                h="6px"
                bg="gray.200"
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="full"
                  w={`${percentage}%`}
                  bgGradient={config.gradient}
                  borderRadius="full"
                  transition="width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                />
              </Box>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}
