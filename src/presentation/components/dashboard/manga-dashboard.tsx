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
  MdMenuBook,
  MdCheckCircle,
  MdError,
  MdStorage,
  MdCategory,
  MdBookmark,
} from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchMangaDashboard,
  selectMangaData,
  selectMangaLoading,
  selectMangaTables,
  selectMangaStats,
  selectMangaTotalRows,
  selectMangaDbStatus,
  selectMangaError,
} from "@/store/slices/manga/dashboard-slice";
import { StatCard } from "./stat-card";
import { MangaConfigForm } from "./manga-config-form";

function DashboardPanel() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectMangaData);
  const loading = useAppSelector(selectMangaLoading);
  const error = useAppSelector(selectMangaError);
  const tables = useAppSelector(selectMangaTables);
  const stats = useAppSelector(selectMangaStats);
  const totalRows = useAppSelector(selectMangaTotalRows);
  const dbStatus = useAppSelector(selectMangaDbStatus);

  useEffect(() => { dispatch(fetchMangaDashboard()); }, [dispatch]);

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  const connected = dbStatus === "connected";

  return (
    <Flex direction="column" gap={5}>
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex align="center" gap={3}>
          <Icon as={connected ? MdCheckCircle : MdError} boxSize={6} color={connected ? "green.500" : "red.500"} />
          <Box>
            <Text fontSize="sm" fontWeight="700" color="gray.800">Database Status</Text>
            <Text fontSize="xs" color="gray.500">
              {connected ? `Connected — manga_app @ 194.163.133.119` : `Error: ${error || data?.error || "Connection failed"}`}
            </Text>
          </Box>
        </Flex>
      </Box>

      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
        <StatCard title="Tables" value={String(tables.length)} icon={MdStorage} gradient="linear(135deg, #ec4899, #db2777)" change={tables.length === 0 ? "Empty database — ready for setup" : `${tables.join(", ")}`} changeType="neutral" />
        <StatCard title="Total Rows" value={String(totalRows)} icon={MdMenuBook} gradient="linear(135deg, #8b5cf6, #7c3aed)" change={totalRows === 0 ? "No data yet" : "Across all tables"} changeType={totalRows > 0 ? "positive" : "neutral"} />
      </SimpleGrid>

      {tables.length > 0 && (
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>Tables</Text>
          <VStack spacing={2} align="stretch">
            {tables.map((table) => (
              <Flex key={table} align="center" justify="space-between" p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "pink.50" }} transition="all 0.15s">
                <Flex align="center" gap={3}>
                  <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="pink.50" flexShrink={0}>
                    <Icon as={MdStorage} boxSize={4} color="pink.600" />
                  </Flex>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">{table}</Text>
                </Flex>
                <Badge bg="pink.50" color="pink.700" borderRadius="lg" px={2.5} fontSize="sm">{stats[table] || 0} rows</Badge>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      {tables.length === 0 && connected && (
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={8} textAlign="center" boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Icon as={MdMenuBook} boxSize={12} color="pink.200" mb={3} />
          <Text fontSize="md" fontWeight="600" color="gray.700">Database is empty</Text>
          <Text fontSize="sm" color="gray.400" mt={1}>manga_app database is ready. Tables will appear here once the backend creates them.</Text>
        </Box>
      )}
    </Flex>
  );
}

function TableBrowsePanel({ icon, title, filterTable }: { icon: typeof MdMenuBook; title: string; filterTable?: string }) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectMangaLoading);
  const tables = useAppSelector(selectMangaTables);
  const stats = useAppSelector(selectMangaStats);

  useEffect(() => { dispatch(fetchMangaDashboard()); }, [dispatch]);

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  const filtered = filterTable ? tables.filter((t) => t.toLowerCase().includes(filterTable)) : tables;

  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      <Flex align="center" gap={2} mb={4}>
        <Icon as={icon} boxSize={5} color="pink.500" />
        <Text fontSize="md" fontWeight="700" color="gray.800">{title}</Text>
        <Badge bg="pink.50" color="pink.700" borderRadius="lg" px={2}>{filtered.length} tables</Badge>
      </Flex>
      {filtered.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {filtered.map((table) => (
            <Flex key={table} align="center" justify="space-between" p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "pink.50" }} transition="all 0.15s">
              <Flex align="center" gap={3}>
                <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="pink.50" flexShrink={0}>
                  <Icon as={MdStorage} boxSize={4} color="pink.600" />
                </Flex>
                <Text fontSize="sm" fontWeight="600" color="gray.800">{table}</Text>
              </Flex>
              <Badge bg="pink.50" color="pink.700" borderRadius="lg" px={2.5} fontSize="sm">{stats[table] || 0} rows</Badge>
            </Flex>
          ))}
        </VStack>
      ) : (
        <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No matching tables found. Data will appear once the backend creates them.</Text>
      )}
    </Box>
  );
}

export function MangaDashboard() {
  const { activePage } = useApp();
  if (activePage === "manga") return <TableBrowsePanel icon={MdMenuBook} title="Manga Tables" filterTable="manga" />;
  if (activePage === "genres") return <TableBrowsePanel icon={MdCategory} title="Genre Tables" filterTable="genre" />;
  if (activePage === "bookmarks") return <TableBrowsePanel icon={MdBookmark} title="Bookmark Tables" filterTable="bookmark" />;
  if (activePage === "settings") return <MangaConfigForm />;
  return <DashboardPanel />;
}
