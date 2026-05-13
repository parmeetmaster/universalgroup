"use client";

import { Box, Flex, useDisclosure } from "@chakra-ui/react";
import { Sidebar } from "@/presentation/components/sidebar/sidebar";
import { Navbar } from "@/presentation/components/common/navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minH="100vh" bg="dashboard.bg">
      <Sidebar isOpen={isOpen} onClose={onClose} />

      <Box
        ml={{ base: 0, lg: "280px" }}
        flex={1}
        transition="margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        w={{ base: "100%", lg: "calc(100% - 280px)" }}
      >
        <Navbar onToggleSidebar={onOpen} />
        <Box
          as="main"
          p={{ base: 4, md: 6, lg: 8 }}
          maxW="1400px"
          mx="auto"
          w="full"
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
