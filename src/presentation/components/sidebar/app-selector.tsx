"use client";

import {
  Box,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { MdUnfoldMore } from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";

export function AppSelector() {
  const { currentApp, setCurrentApp, apps } = useApp();

  return (
    <Menu>
      <MenuButton
        w="full"
        px={3}
        py={3}
        borderRadius="xl"
        bg="linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
        bgGradient="linear(135deg, brand.50, brand.100)"
        _hover={{ bgGradient: "linear(135deg, brand.100, brand.200)" }}
        transition="all 0.2s"
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={3}>
            <Flex
              align="center"
              justify="center"
              w={9}
              h={9}
              borderRadius="xl"
              bgGradient="linear(135deg, brand.500, brand.700)"
              boxShadow="0 4px 12px rgba(124, 58, 237, 0.3)"
              flexShrink={0}
            >
              <Icon as={currentApp.icon} boxSize={4} color="white" />
            </Flex>
            <Box textAlign="left">
              <Text fontSize="sm" fontWeight="700" color="gray.800" lineHeight="1.2">
                {currentApp.name}
              </Text>
              <Text fontSize="xs" color="gray.500" lineHeight="1.2" mt={0.5}>
                {currentApp.description}
              </Text>
            </Box>
          </Flex>
          <Icon as={MdUnfoldMore} boxSize={4} color="gray.400" />
        </Flex>
      </MenuButton>
      <MenuList
        bg="white"
        borderColor="dashboard.border"
        borderRadius="xl"
        py={2}
        minW="250px"
        boxShadow="0 20px 60px rgba(124, 58, 237, 0.12), 0 4px 16px rgba(0,0,0,0.06)"
      >
        {apps.map((app) => (
          <MenuItem
            key={app.id}
            onClick={() => setCurrentApp(app.id)}
            bg={app.id === currentApp.id ? "brand.50" : "transparent"}
            _hover={{ bg: "brand.50" }}
            px={4}
            py={2.5}
            mx={1}
            borderRadius="lg"
          >
            <Flex align="center" gap={3}>
              <Flex
                align="center"
                justify="center"
                w={8}
                h={8}
                borderRadius="lg"
                bgGradient={app.id === currentApp.id ? "linear(135deg, brand.500, brand.700)" : undefined}
                bg={app.id !== currentApp.id ? "gray.100" : undefined}
              >
                <Icon
                  as={app.icon}
                  boxSize={4}
                  color={app.id === currentApp.id ? "white" : "gray.500"}
                />
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.800">
                  {app.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {app.description}
                </Text>
              </Box>
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
