"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Text,
  Icon,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
} from "@chakra-ui/react";
import { MdChevronLeft, MdChevronRight, MdLogout } from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";
import { useAuth } from "@/presentation/providers/auth-context";
import { AppSelector } from "./app-selector";
import { NavItem } from "./nav-item";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({
  isCollapsed,
  onToggleCollapse,
  onNavClick,
}: {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onNavClick?: () => void;
}) {
  const { currentApp, activePage, setActivePage } = useApp();
  const { logout } = useAuth();

  return (
    <Flex
      direction="column"
      h="full"
      bg="white"
      overflow="hidden"
    >
      <Box p={4}>
        {!isCollapsed && <AppSelector />}
        {isCollapsed && (
          <Flex
            align="center"
            justify="center"
            w={10}
            h={10}
            borderRadius="xl"
            bgGradient={currentApp.gradient}
            mx="auto"
          >
            <Icon as={currentApp.icon} boxSize={5} color="white" />
          </Flex>
        )}
      </Box>

      {!isCollapsed && (
        <Text
          fontSize="xs"
          fontWeight="600"
          color="gray.400"
          textTransform="uppercase"
          letterSpacing="wider"
          px={5}
          mt={1}
          mb={1}
        >
          Navigation
        </Text>
      )}

      <Flex direction="column" flex={1} py={1} gap={0.5} overflowY="auto">
        {currentApp.navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.id}
            isCollapsed={isCollapsed}
            subItems={item.children}
            activePage={activePage}
            onClick={() => {
              setActivePage(item.id);
              onNavClick?.();
            }}
            onChildClick={(id) => {
              setActivePage(id);
              onNavClick?.();
            }}
          />
        ))}
      </Flex>

      <Flex
        p={2}
        direction="column"
        gap={1}
        borderTop="1px"
        borderColor="gray.100"
      >
        <Flex
          as="button"
          onClick={logout}
          align="center"
          justify={isCollapsed ? "center" : "flex-start"}
          gap={2}
          px={isCollapsed ? 0 : 3}
          py={2}
          borderRadius="lg"
          color="gray.400"
          fontSize="sm"
          fontWeight="500"
          cursor="pointer"
          transition="all 0.15s ease"
          _hover={{ bg: "red.50", color: "red.500" }}
          w="full"
        >
          <Icon as={MdLogout} boxSize={4} />
          {!isCollapsed && <Text>Logout</Text>}
        </Flex>
        {onToggleCollapse && (
          <Flex justify={isCollapsed ? "center" : "flex-end"}>
            <IconButton
              aria-label="Toggle sidebar"
              icon={isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
              onClick={onToggleCollapse}
              variant="ghost"
              color="gray.400"
              size="sm"
              borderRadius="lg"
              _hover={{ bg: "brand.50", color: "brand.600" }}
            />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useBreakpointValue({ base: true, lg: false });

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <DrawerContent bg="white" maxW="280px" borderRightRadius="2xl">
          <DrawerBody p={0}>
            <SidebarContent isCollapsed={false} onNavClick={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Box
      as="aside"
      w={isCollapsed ? "70px" : "280px"}
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      transition="width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      borderRight="1px"
      borderColor="gray.100"
      zIndex={20}
    >
      <SidebarContent
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
    </Box>
  );
}
