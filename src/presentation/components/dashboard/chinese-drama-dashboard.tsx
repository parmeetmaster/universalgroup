"use client";

import { useEffect } from "react";
import {
  SimpleGrid,
  Box,
  Flex,
  Text,
  Badge,
  VStack,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import {
  MdMovie,
  MdOndemandVideo,
  MdPeople,
  MdCategory,
  MdPlayCircle,
} from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchCdDashboard,
  selectCdLoading,
  selectCdStats,
  selectCdRecentEpisodes,
  selectCdRecentUsers,
  selectCdError,
} from "@/store/slices/chinese-drama/dashboard-slice";
import { StatCard } from "./stat-card";

function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DashboardPanel() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectCdLoading);
  const stats = useAppSelector(selectCdStats);
  const recentEpisodes = useAppSelector(selectCdRecentEpisodes);
  const recentUsers = useAppSelector(selectCdRecentUsers);
  const error = useAppSelector(selectCdError);

  useEffect(() => {
    dispatch(fetchCdDashboard());
  }, [dispatch]);

  if (loading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner color="brand.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box bg="red.50" borderRadius="2xl" p={5}>
        <Text color="red.600" fontWeight="600">Failed to load dashboard: {error}</Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap={5}>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
        <StatCard title="Total Dramas" value={formatNumber(stats.totalDramas)} icon={MdMovie} gradient="linear(135deg, #e53935, #c62828)" change="From database" changeType="neutral" />
        <StatCard title="Total Episodes" value={formatNumber(stats.totalEpisodes)} icon={MdOndemandVideo} gradient="linear(135deg, #a855f7, #7c3aed)" change="Across all dramas" changeType="positive" />
        <StatCard title="Total Users" value={formatNumber(stats.totalUsers)} icon={MdPeople} gradient="linear(135deg, #06b6d4, #0891b2)" change="Registered users" changeType="neutral" />
        <StatCard title="Total Genres" value={formatNumber(stats.totalGenres)} icon={MdCategory} gradient="linear(135deg, #f97316, #ea580c)" change="Content categories" changeType="neutral" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Flex align="center" gap={2} mb={4}>
            <Text fontSize="md" fontWeight="700" color="gray.800">Recent Episodes</Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{recentEpisodes.length}</Badge>
          </Flex>
          <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
            {recentEpisodes.map((e) => (
              <Flex key={e.id} align="center" gap={3} p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "brand.50" }} transition="all 0.15s">
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="purple.50" flexShrink={0}>
                  <Icon as={MdPlayCircle} boxSize={4} color="purple.600" />
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{e.dramaTitle}</Text>
                  <Text fontSize="xs" color="gray.400">EP {e.episodeNumber} — {e.title || "Untitled"}</Text>
                </Box>
                <Flex gap={1} flexShrink={0}>
                  {e.isVip && <Badge fontSize="2xs" borderRadius="lg" bg="yellow.50" color="yellow.700">VIP</Badge>}
                  {e.sourceType && <Badge fontSize="2xs" borderRadius="lg" bg="blue.50" color="blue.600">{e.sourceType}</Badge>}
                  {e.status && <Badge fontSize="2xs" borderRadius="lg" bg={e.status === "active" ? "green.50" : "gray.100"} color={e.status === "active" ? "green.600" : "gray.500"}>{e.status}</Badge>}
                </Flex>
              </Flex>
            ))}
            {recentEpisodes.length === 0 && (
              <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No episodes found</Text>
            )}
          </VStack>
        </Box>

        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Flex align="center" gap={2} mb={4}>
            <Text fontSize="md" fontWeight="700" color="gray.800">Recent Users</Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{recentUsers.length}</Badge>
          </Flex>
          <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
            {recentUsers.map((u) => (
              <Flex key={u.id} align="center" gap={3} p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "brand.50" }} transition="all 0.15s">
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="cyan.50" flexShrink={0}>
                  <Icon as={MdPeople} boxSize={4} color="cyan.600" />
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{u.name || "Anonymous"}</Text>
                  <Text fontSize="xs" color="gray.400">{u.email || "No email"}</Text>
                </Box>
                <Flex gap={1} flexShrink={0} align="center">
                  {u.country && <Badge fontSize="2xs" borderRadius="lg" bg="blue.50" color="blue.600">{u.country}</Badge>}
                  <Text fontSize="2xs" color="gray.400">{formatDate(u.lastLoginAt)}</Text>
                </Flex>
              </Flex>
            ))}
            {recentUsers.length === 0 && (
              <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No users found</Text>
            )}
          </VStack>
        </Box>
      </SimpleGrid>
    </Flex>
  );
}

function EpisodesPanel() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectCdLoading);
  const recentEpisodes = useAppSelector(selectCdRecentEpisodes);

  useEffect(() => {
    dispatch(fetchCdDashboard());
  }, [dispatch]);

  if (loading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner color="brand.500" />
      </Flex>
    );
  }

  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      <Flex align="center" gap={2} mb={4}>
        <Text fontSize="md" fontWeight="700" color="gray.800">All Recent Episodes</Text>
        <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{recentEpisodes.length}</Badge>
      </Flex>
      <Box overflowX="auto">
        <Box as="table" w="full" fontSize="sm">
          <Box as="thead">
            <Box as="tr" borderBottom="1px" borderColor="gray.100">
              {["Drama", "EP #", "Title", "Source", "VIP", "Status", "Date"].map((h) => (
                <Box key={h} as="th" textAlign="left" py={2} px={3} fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider">{h}</Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {recentEpisodes.map((e) => (
              <Box key={e.id} as="tr" borderBottom="1px" borderColor="gray.50" _hover={{ bg: "gray.50" }} transition="all 0.1s">
                <Box as="td" py={2} px={3} fontWeight="500" color="gray.800" maxW="200px"><Text noOfLines={1}>{e.dramaTitle}</Text></Box>
                <Box as="td" py={2} px={3} color="gray.600">{e.episodeNumber}</Box>
                <Box as="td" py={2} px={3} color="gray.600" maxW="180px"><Text noOfLines={1}>{e.title || "-"}</Text></Box>
                <Box as="td" py={2} px={3}><Badge fontSize="2xs" borderRadius="lg" bg="blue.50" color="blue.600">{e.sourceType || "-"}</Badge></Box>
                <Box as="td" py={2} px={3}>{e.isVip ? <Badge fontSize="2xs" borderRadius="lg" bg="yellow.50" color="yellow.700">VIP</Badge> : <Text color="gray.400">-</Text>}</Box>
                <Box as="td" py={2} px={3}><Badge fontSize="2xs" borderRadius="lg" bg={e.status === "active" ? "green.50" : "gray.100"} color={e.status === "active" ? "green.600" : "gray.500"}>{e.status || "-"}</Badge></Box>
                <Box as="td" py={2} px={3} color="gray.400" fontSize="xs">{formatDate(e.createdAt)}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      {recentEpisodes.length === 0 && (
        <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No episodes found</Text>
      )}
    </Box>
  );
}

function UsersPanel() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectCdLoading);
  const recentUsers = useAppSelector(selectCdRecentUsers);

  useEffect(() => {
    dispatch(fetchCdDashboard());
  }, [dispatch]);

  if (loading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner color="brand.500" />
      </Flex>
    );
  }

  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      <Flex align="center" gap={2} mb={4}>
        <Text fontSize="md" fontWeight="700" color="gray.800">Recent Users</Text>
        <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{recentUsers.length}</Badge>
      </Flex>
      <Box overflowX="auto">
        <Box as="table" w="full" fontSize="sm">
          <Box as="thead">
            <Box as="tr" borderBottom="1px" borderColor="gray.100">
              {["Name", "Email", "Country", "Device", "Last Login"].map((h) => (
                <Box key={h} as="th" textAlign="left" py={2} px={3} fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wider">{h}</Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {recentUsers.map((u) => (
              <Box key={u.id} as="tr" borderBottom="1px" borderColor="gray.50" _hover={{ bg: "gray.50" }} transition="all 0.1s">
                <Box as="td" py={2} px={3} fontWeight="500" color="gray.800">{u.name || "Anonymous"}</Box>
                <Box as="td" py={2} px={3} color="gray.600">{u.email || "-"}</Box>
                <Box as="td" py={2} px={3}><Badge fontSize="2xs" borderRadius="lg" bg="blue.50" color="blue.600">{u.country || "-"}</Badge></Box>
                <Box as="td" py={2} px={3} color="gray.600">{u.device || "-"}</Box>
                <Box as="td" py={2} px={3} color="gray.400" fontSize="xs">{formatDate(u.lastLoginAt)}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      {recentUsers.length === 0 && (
        <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No users found</Text>
      )}
    </Box>
  );
}

export function ChineseDramaDashboard() {
  const { activePage } = useApp();
  if (activePage === "episodes") return <EpisodesPanel />;
  if (activePage === "users") return <UsersPanel />;
  return <DashboardPanel />;
}
