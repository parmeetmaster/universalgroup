"use client";

import { useState } from "react";
import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { IconType } from "react-icons";
import { MdExpandMore, MdChevronRight } from "react-icons/md";
import type { NavItem as NavItemConfig } from "@/config/apps";

interface NavItemProps {
  icon: IconType;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  subItems?: NavItemConfig[];
  activePage?: string;
  onChildClick?: (id: string) => void;
}

export function NavItem({
  icon,
  label,
  isActive = false,
  isCollapsed = false,
  onClick,
  subItems,
  activePage,
  onChildClick,
}: NavItemProps) {
  const hasChildren = subItems && subItems.length > 0;
  const childActive = hasChildren && subItems.some((c) => c.id === activePage);
  const [expanded, setExpanded] = useState(childActive || isActive);

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onClick?.();
    }
  };

  return (
    <Box>
      <Flex
        align="center"
        gap={3}
        px={3}
        py={2.5}
        mx={2}
        borderRadius="xl"
        cursor="pointer"
        bg={isActive && !hasChildren ? "brand.50" : "transparent"}
        color={isActive && !hasChildren ? "brand.700" : childActive ? "gray.700" : "gray.500"}
        fontWeight={childActive ? "600" : undefined}
        _hover={{
          bg: isActive && !hasChildren ? "brand.50" : "gray.50",
          color: isActive && !hasChildren ? "brand.700" : "gray.700",
        }}
        transition="all 0.15s"
        onClick={handleClick}
        role="button"
        title={isCollapsed ? label : undefined}
        position="relative"
        _before={isActive && !hasChildren ? {
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
          <>
            <Text fontSize="sm" fontWeight={isActive || childActive ? "600" : "500"} flex={1}>
              {label}
            </Text>
            {hasChildren && (
              <Icon
                as={expanded ? MdExpandMore : MdChevronRight}
                boxSize={4}
                color="gray.400"
                transition="transform 0.15s"
              />
            )}
          </>
        )}
      </Flex>

      {hasChildren && expanded && !isCollapsed && (
        <Box pl={4} mt={0.5}>
          {subItems.map((child) => {
            const isChildActive = activePage === child.id;
            return (
              <Flex
                key={child.id}
                align="center"
                gap={2.5}
                px={3}
                py={2}
                mx={2}
                borderRadius="lg"
                cursor="pointer"
                bg={isChildActive ? "brand.50" : "transparent"}
                color={isChildActive ? "brand.700" : "gray.500"}
                _hover={{
                  bg: isChildActive ? "brand.50" : "gray.50",
                  color: isChildActive ? "brand.700" : "gray.700",
                }}
                transition="all 0.15s"
                onClick={() => onChildClick?.(child.id)}
                role="button"
                position="relative"
                _before={isChildActive ? {
                  content: '""',
                  position: "absolute",
                  left: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "3px",
                  height: "50%",
                  borderRadius: "full",
                  bgGradient: "linear(to-b, brand.400, brand.600)",
                } : undefined}
              >
                <Icon as={child.icon} boxSize={4} flexShrink={0} />
                <Text fontSize="xs" fontWeight={isChildActive ? "600" : "500"}>
                  {child.label}
                </Text>
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
