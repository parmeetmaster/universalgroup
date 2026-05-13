"use client";

import { Flex, Icon, Text } from "@chakra-ui/react";
import { IconType } from "react-icons";

interface NavItemProps {
  icon: IconType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({
  icon,
  label,
  isActive = false,
  isCollapsed = false,
  onClick,
}: NavItemProps) {
  return (
    <Flex
      align="center"
      gap={3}
      px={3}
      py={2.5}
      mx={2}
      borderRadius="xl"
      cursor="pointer"
      bg={isActive ? "brand.50" : "transparent"}
      color={isActive ? "brand.700" : "gray.500"}
      _hover={{
        bg: isActive ? "brand.50" : "gray.50",
        color: isActive ? "brand.700" : "gray.700",
      }}
      transition="all 0.15s"
      onClick={onClick}
      role="button"
      title={isCollapsed ? label : undefined}
      position="relative"
      _before={isActive ? {
        content: '""',
        position: "absolute",
        left: "-8px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "4px",
        height: "60%",
        borderRadius: "full",
        bgGradient: "linear(to-b, brand.400, brand.600)",
      } : undefined}
    >
      <Icon as={icon} boxSize={5} flexShrink={0} />
      {!isCollapsed && (
        <Text fontSize="sm" fontWeight={isActive ? "600" : "500"}>
          {label}
        </Text>
      )}
    </Flex>
  );
}
