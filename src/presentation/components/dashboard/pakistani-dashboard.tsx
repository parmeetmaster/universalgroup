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
  Input,
  Button,
} from "@chakra-ui/react";
import {
  MdMovie,
  MdOndemandVideo,
  MdCategory,
  MdSearch,
} from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchPakDashboard,
  searchPakDramas,
  setSearchQuery,
  selectPakData,
  selectPakLoading,
  selectPakStats,
  selectPakDramas,
  selectPakGenres,
  selectPakRecentEpisodes,
  selectPakSearchResults,
  selectPakSearchLoading,
} from "@/store/slices/pak/dashboard-slice";
import { StatCard } from "./stat-card";
import { PakConfigForm } from "./pak-config-form";

function DashboardPanel() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectPakData);
  const loading = useAppSelector(selectPakLoading);
  const s = useAppSelector(selectPakStats);
  const dramas = useAppSelector(selectPakDramas);
  const genres = useAppSelector(selectPakGenres);
  const recentEpisodes = useAppSelector(selectPakRecentEpisodes);

  useEffect(() => { dispatch(fetchPakDashboard()); }, [dispatch]);

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  return (
    <Flex direction="column" gap={5}>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
        <StatCard title="Total Dramas" value={String(s?.totalDramas || 0)} icon={MdMovie} gradient="linear(135deg, #06b6d4, #0891b2)" change="From database" changeType="neutral" />
        <StatCard title="Total Episodes" value={String(s?.totalEpisodes || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} icon={MdOndemandVideo} gradient="linear(135deg, #a855f7, #7c3aed)" change="Across all dramas" changeType="positive" />
        <StatCard title="Genres" value={String(s?.totalGenres || 0)} icon={MdCategory} gradient="linear(135deg, #f97316, #ea580c)" change={genres?.map(g => g.name).join(", ") || ""} changeType="neutral" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Flex align="center" gap={2} mb={4}>
            <Text fontSize="md" fontWeight="700" color="gray.800">Recent Dramas</Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{dramas?.length}</Badge>
          </Flex>
          <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
            {dramas?.map((d) => (
              <Flex key={d.id} align="center" gap={3} p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "brand.50" }} transition="all 0.15s">
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="brand.50" flexShrink={0}>
                  <Icon as={MdMovie} boxSize={4} color="brand.600" />
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{d.title}</Text>
                  <Text fontSize="xs" color="gray.400">{d.slug}</Text>
                </Box>
                {d.status && <Badge fontSize="xs" borderRadius="lg" bg={d.status === "ongoing" ? "green.50" : "blue.50"} color={d.status === "ongoing" ? "green.600" : "blue.600"}>{d.status}</Badge>}
              </Flex>
            ))}
          </VStack>
        </Box>

        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>Recent Episodes</Text>
          <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
            {recentEpisodes?.map((e) => (
              <Flex key={e.id} align="center" gap={3} p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "brand.50" }} transition="all 0.15s">
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="purple.50" flexShrink={0}>
                  <Icon as={MdOndemandVideo} boxSize={4} color="purple.600" />
                </Flex>
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{e.dramaTitle}</Text>
                  <Text fontSize="xs" color="gray.400">EP {e.number} — {e.title}</Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>
    </Flex>
  );
}

function SearchPanel() {
  const dispatch = useAppDispatch();
  const results = useAppSelector(selectPakSearchResults);
  const loading = useAppSelector(selectPakSearchLoading);
  const query = useAppSelector((state: { pakDashboard: { searchQuery: string } }) => state.pakDashboard.searchQuery);

  const doSearch = () => {
    if (!query.trim()) return;
    dispatch(searchPakDramas(query));
  };

  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>Search Dramas</Text>
      <Flex gap={2} mb={4}>
        <Input placeholder="Search by name..." value={query} onChange={(e) => dispatch(setSearchQuery(e.target.value))} onKeyDown={(e) => e.key === "Enter" && doSearch()} size="sm" borderRadius="lg" bg="gray.50" />
        <Button onClick={doSearch} isLoading={loading} size="sm" colorScheme="brand" borderRadius="lg" leftIcon={<MdSearch />}>Search</Button>
      </Flex>
      {results !== null && (results.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {results.map((r, i) => (
            <Flex key={i} p={3} borderRadius="xl" bg="gray.50" gap={3} align="center">
              <Icon as={MdMovie} boxSize={4} color="brand.500" />
              <Text fontSize="sm" fontWeight="500" color="gray.700">{r.title || r.name || JSON.stringify(r)}</Text>
            </Flex>
          ))}
        </VStack>
      ) : <Text fontSize="sm" color="gray.400">No results for &quot;{query}&quot;</Text>)}
    </Box>
  );
}

export function PakistaniDashboard() {
  const { activePage } = useApp();
  if (activePage === "dramas" || activePage === "genres") return <DashboardPanel />;
  if (activePage === "search") return <SearchPanel />;
  if (activePage === "config") return <PakConfigForm />;
  return <DashboardPanel />;
}
