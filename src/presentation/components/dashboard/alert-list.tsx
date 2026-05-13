"use client";

import {
  Box,
  Flex,
  Icon,
  Text,
  Badge,
  VStack,
} from "@chakra-ui/react";
import { MdWarning, MdError, MdInfo } from "react-icons/md";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  time: string;
}

const severityConfig = {
  critical: { icon: MdError, color: "red.500", bg: "red.50", badge: "red" },
  warning: { icon: MdWarning, color: "orange.500", bg: "orange.50", badge: "orange" },
  info: { icon: MdInfo, color: "blue.500", bg: "blue.50", badge: "blue" },
};

const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "Critical Water Level - Station A",
    description: "Water level exceeded danger mark at 12.5m",
    severity: "critical",
    time: "2 min ago",
  },
  {
    id: "2",
    title: "Rising Water - Yamuna River",
    description: "Water level rising rapidly, 0.5m increase in 1 hour",
    severity: "warning",
    time: "15 min ago",
  },
  {
    id: "3",
    title: "New Sensor Online",
    description: "Station C sensor reconnected after maintenance",
    severity: "info",
    time: "1 hour ago",
  },
  {
    id: "4",
    title: "Heavy Rainfall Alert",
    description: "Expected 120mm rainfall in next 6 hours upstream",
    severity: "warning",
    time: "2 hours ago",
  },
];

export function AlertList() {
  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      p={5}
      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Flex align="center" gap={2}>
          <Box w="3px" h="18px" bgGradient="linear(to-b, red.400, orange.400)" borderRadius="full" />
          <Text fontSize="md" fontWeight="700" color="gray.800">
            Recent Alerts
          </Text>
        </Flex>
        <Badge
          bg="red.50"
          color="red.600"
          borderRadius="lg"
          px={2.5}
          py={0.5}
          fontSize="xs"
          fontWeight="600"
        >
          {mockAlerts.filter((a) => a.severity === "critical").length} Critical
        </Badge>
      </Flex>

      <VStack spacing={2.5} align="stretch">
        {mockAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <Flex
              key={alert.id}
              align="flex-start"
              gap={3}
              p={3}
              borderRadius="xl"
              bg={config.bg}
              _hover={{ transform: "translateX(4px)" }}
              cursor="pointer"
              transition="all 0.15s"
              border="1px"
              borderColor="transparent"
            >
              <Flex
                align="center"
                justify="center"
                w={8}
                h={8}
                borderRadius="lg"
                bg="white"
                flexShrink={0}
                mt={0.5}
              >
                <Icon as={config.icon} boxSize={4} color={config.color} />
              </Flex>
              <Box flex={1}>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="600" color="gray.800">
                    {alert.title}
                  </Text>
                  <Text fontSize="xs" color="gray.400" flexShrink={0} ml={2}>
                    {alert.time}
                  </Text>
                </Flex>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                  {alert.description}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
}
