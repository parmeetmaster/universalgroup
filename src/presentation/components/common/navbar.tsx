"use client";

import {
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Box,
  Icon,
  Text,
  useBreakpointValue,
  HStack,
} from "@chakra-ui/react";
import {
  MdMenu,
  MdSearch,
  MdNotifications,
  MdPerson,
  MdLogout,
  MdSettings,
  MdFullscreen,
} from "react-icons/md";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const isMobile = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      h="70px"
      px={{ base: 4, md: 6 }}
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="blur(12px)"
      borderBottom="1px"
      borderColor="gray.100"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex align="center" gap={3}>
        {isMobile && (
          <IconButton
            aria-label="Open menu"
            icon={<MdMenu />}
            onClick={onToggleSidebar}
            variant="ghost"
            color="gray.500"
            borderRadius="xl"
            _hover={{ color: "brand.600", bg: "brand.50" }}
          />
        )}
        <InputGroup maxW={{ base: "200px", md: "360px" }}>
          <InputLeftElement pointerEvents="none" h="full">
            <Icon as={MdSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search anything..."
            bg="gray.50"
            border="1px"
            borderColor="gray.200"
            _hover={{ borderColor: "brand.300", bg: "white" }}
            _focus={{
              borderColor: "brand.500",
              boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.1)",
              bg: "white",
            }}
            _placeholder={{ color: "gray.400", fontSize: "sm" }}
            fontSize="sm"
            borderRadius="xl"
            h="42px"
          />
        </InputGroup>
      </Flex>

      <HStack spacing={1}>
        <IconButton
          aria-label="Fullscreen"
          icon={<MdFullscreen />}
          variant="ghost"
          color="gray.400"
          borderRadius="xl"
          _hover={{ color: "brand.600", bg: "brand.50" }}
          display={{ base: "none", md: "flex" }}
        />

        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<MdNotifications />}
            variant="ghost"
            color="gray.400"
            borderRadius="xl"
            _hover={{ color: "brand.600", bg: "brand.50" }}
            fontSize="xl"
          />
          <Badge
            position="absolute"
            top="6px"
            right="6px"
            bg="red.500"
            color="white"
            borderRadius="full"
            fontSize="9px"
            minW="16px"
            h="16px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px solid white"
          >
            3
          </Badge>
        </Box>

        <Menu>
          <MenuButton ml={1}>
            <Flex
              align="center"
              gap={2}
              px={2}
              py={1.5}
              borderRadius="xl"
              _hover={{ bg: "gray.50" }}
              transition="all 0.15s"
              cursor="pointer"
            >
              <Avatar
                size="sm"
                name="Admin"
                bgGradient="linear(135deg, brand.400, brand.600)"
                color="white"
                fontWeight="700"
                fontSize="xs"
              />
              <Box display={{ base: "none", md: "block" }} textAlign="left">
                <Text fontSize="sm" fontWeight="600" color="gray.800" lineHeight="1.2">
                  Admin User
                </Text>
                <Text fontSize="xs" color="gray.400" lineHeight="1.2">
                  admin@baad.io
                </Text>
              </Box>
            </Flex>
          </MenuButton>
          <MenuList
            bg="white"
            borderColor="gray.100"
            borderRadius="xl"
            boxShadow="0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)"
            py={2}
          >
            <MenuItem
              icon={<MdPerson />}
              bg="transparent"
              _hover={{ bg: "gray.50" }}
              borderRadius="lg"
              mx={1}
            >
              <Text fontSize="sm">Profile</Text>
            </MenuItem>
            <MenuItem
              icon={<MdSettings />}
              bg="transparent"
              _hover={{ bg: "gray.50" }}
              borderRadius="lg"
              mx={1}
            >
              <Text fontSize="sm">Settings</Text>
            </MenuItem>
            <Box borderTop="1px" borderColor="gray.100" my={1} />
            <MenuItem
              icon={<MdLogout />}
              bg="transparent"
              _hover={{ bg: "red.50" }}
              color="red.500"
              borderRadius="lg"
              mx={1}
            >
              <Text fontSize="sm">Logout</Text>
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
}
