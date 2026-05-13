"use client";

import { Box, Flex, Icon, Text, VStack } from "@chakra-ui/react";
import {
  MdCheckCircle,
  MdUpgrade,
  MdSensors,
  MdPeople,
} from "react-icons/md";
import { IconType } from "react-icons";

interface Activity {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: IconType;
  color: string;
  bg: string;
}

const activities: Activity[] = [
  {
    id: "1",
    action: "Sensor Calibrated",
    detail: "Station A sensors recalibrated successfully",
    time: "10 min ago",
    icon: MdSensors,
    color: "brand.600",
    bg: "brand.50",
  },
  {
    id: "2",
    action: "Alert Resolved",
    detail: "Water level dropped below warning at Station D",
    time: "25 min ago",
    icon: MdCheckCircle,
    color: "green.600",
    bg: "green.50",
  },
  {
    id: "3",
    action: "System Update",
    detail: "Prediction model v2.3 deployed",
    time: "1 hour ago",
    icon: MdUpgrade,
    color: "purple.600",
    bg: "purple.50",
  },
  {
    id: "4",
    action: "Team Response",
    detail: "Emergency team dispatched to Zone C",
    time: "2 hours ago",
    icon: MdPeople,
    color: "orange.600",
    bg: "orange.50",
  },
];

export function ActivityFeed() {
  return (
    <Box
      bg="white"
      border="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      p={5}
      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
    >
      <Flex align="center" gap={2} mb={4}>
        <Box w="3px" h="18px" bgGradient="linear(to-b, brand.400, purple.400)" borderRadius="full" />
        <Text fontSize="md" fontWeight="700" color="gray.800">
          Activity Feed
        </Text>
      </Flex>

      <VStack spacing={0} align="stretch">
        {activities.map((activity, index) => (
          <Flex
            key={activity.id}
            gap={3}
            py={3.5}
            px={2}
            borderBottom={index < activities.length - 1 ? "1px" : "none"}
            borderColor="gray.100"
            _hover={{ bg: "gray.50", borderRadius: "xl" }}
            transition="all 0.15s"
            cursor="pointer"
          >
            <Flex
              align="center"
              justify="center"
              w="40px"
              h="40px"
              borderRadius="xl"
              bg={activity.bg}
              flexShrink={0}
            >
              <Icon as={activity.icon} boxSize={4.5} color={activity.color} />
            </Flex>
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="600" color="gray.800">
                {activity.action}
              </Text>
              <Text fontSize="xs" color="gray.500" mt={0.5}>
                {activity.detail}
              </Text>
            </Box>
            <Text fontSize="xs" color="gray.400" flexShrink={0} fontWeight="500">
              {activity.time}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
