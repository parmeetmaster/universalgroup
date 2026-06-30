"use client";

import { Text, Flex, Box, HStack, Badge, Icon, Spinner } from "@chakra-ui/react";
import { MdCircle } from "react-icons/md";
import { DashboardLayout } from "@/presentation/layouts/dashboard-layout";
import { AnimeDashboard } from "@/presentation/components/dashboard/anime-dashboard";
import { PakistaniDashboard } from "@/presentation/components/dashboard/pakistani-dashboard";
import { AviationDashboard } from "@/presentation/components/dashboard/aviation-dashboard";
import { MangaDashboard } from "@/presentation/components/dashboard/manga-dashboard";
import { ChineseDramaDashboard } from "@/presentation/components/dashboard/chinese-drama-dashboard";
import { useApp } from "@/presentation/providers/app-context";
import { useAuth } from "@/presentation/providers/auth-context";
import { LoginPage } from "@/presentation/components/login/login-page";

const dashboards: Record<string, React.ComponentType> = {
  "anime-downloader": AnimeDashboard,
  "pakistani-serials": PakistaniDashboard,
  "aviation-news": AviationDashboard,
  "manga-app": MangaDashboard,
  "chinese-drama": ChineseDramaDashboard,
};

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentApp, activePage } = useApp();

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="white">
        <Spinner size="xl" color="purple.500" thickness="3px" />
      </Flex>
    );
  }

  // TODO: Re-enable auth after development
  // if (!isAuthenticated) return <LoginPage />;
  const DashboardContent = dashboards[currentApp.id] || AnimeDashboard;

  const pageLabel = currentApp.navItems.find((n) => n.id === activePage)?.label || "Dashboard";

  return (
    <DashboardLayout>
      <Flex direction="column" gap={5}>
        <Box>
          <HStack spacing={3} mb={1}>
            <Text fontSize="xl" fontWeight="800" color="gray.800">
              {pageLabel}
            </Text>
            <Badge
              bgGradient={currentApp.gradient}
              color="white"
              borderRadius="lg"
              px={2}
              py={0.5}
              fontSize="xs"
              fontWeight="600"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon as={MdCircle} boxSize={1.5} /> {currentApp.shortName}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            {currentApp.name} — {currentApp.description}
          </Text>
        </Box>

        <DashboardContent />
      </Flex>
    </DashboardLayout>
  );
}
