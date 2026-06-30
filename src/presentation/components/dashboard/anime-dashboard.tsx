"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  SimpleGrid,
  Box,
  Flex,
  Text,
  Badge,
  VStack,
  Button,
  Code,
  Spinner,
  useToast,
  Input,
  IconButton,
} from "@chakra-ui/react";
import {
  MdPlayCircle,
  MdPublic,
  MdBlock,
  MdStorage,
  MdRefresh,
  MdAdd,
  MdDelete,
} from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchAnimeDashboard,
  triggerScrape,
  selectAnimeLoading,
  selectAnimeStats,
  selectAnimeCountries,
  selectAnimeBlocked,
  selectAnimeKvEntries,
  selectAnimeScraping,
  selectAnimeScrapeResult,
} from "@/store/slices/anime/dashboard-slice";
import {
  blockCountry,
  unblockCountry,
  selectLocalBlocked,
  selectCountryActionLoading,
} from "@/store/slices/anime/countries-slice";
import { StatCard } from "./stat-card";
import { KvStorePanel } from "./kv-store-panel";
import { AppConfigForm } from "./app-config-form";
import { ErrorReportsPanel } from "./error-reports-panel";
import { ScraperPanel } from "./scraper-panel";
import { DevicesPanel } from "./devices-panel";
import { SiteAnalyticsPanel } from "./site-analytics-panel";
import { RatingFeedbackPanel } from "./rating-feedback-panel";

function DashboardPanel() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAnimeLoading);
  const s = useAppSelector(selectAnimeStats);
  const kvEntries = useAppSelector(selectAnimeKvEntries);
  const scraping = useAppSelector(selectAnimeScraping);
  const pollResult = useAppSelector(selectAnimeScrapeResult);
  const toast = useToast();

  useEffect(() => {
    dispatch(fetchAnimeDashboard());
  }, [dispatch]);

  const handleScrape = async () => {
    try {
      await dispatch(triggerScrape()).unwrap();
      toast({ title: "Scrape completed", status: "success", duration: 3000, position: "top-right" });
    } catch {
      toast({ title: "Scrape failed", status: "error", duration: 3000, position: "top-right" });
    }
  };

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  return (
    <Flex direction="column" gap={5}>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
        <StatCard title="Seen Episodes" value={String(s?.seenEpisodes || 0)} icon={MdPlayCircle} gradient="linear(135deg, #a855f7, #7c3aed)" change="From database" changeType="neutral" />
        <StatCard title="Registered Countries" value={String(s?.registeredCountries || 0)} icon={MdPublic} gradient="linear(135deg, #06b6d4, #0891b2)" change="Active regions" changeType="positive" />
        <StatCard title="Blocked Countries" value={String(s?.blockedCountries || 0)} icon={MdBlock} gradient="linear(135deg, #f97316, #ea580c)" change={s?.blockedCountries ? "Restricted" : "None blocked"} changeType={s?.blockedCountries ? "negative" : "positive"} />
        <StatCard title="KV Entries" value={String(s?.kvEntries || 0)} icon={MdStorage} gradient="linear(135deg, #22c55e, #16a34a)" change="Config keys" changeType="neutral" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Text fontSize="md" fontWeight="700" color="gray.800" mb={3}>Scraper Actions</Text>
          <Flex gap={3}>
            <Button onClick={handleScrape} isLoading={scraping} size="sm" colorScheme="brand" borderRadius="lg" leftIcon={<MdRefresh />}>Trigger Scrape</Button>
          </Flex>
          {pollResult && <Code display="block" mt={3} p={3} borderRadius="lg" fontSize="xs" whiteSpace="pre-wrap" maxH="200px" overflowY="auto" bg="gray.50">{pollResult}</Code>}
        </Box>

        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Text fontSize="md" fontWeight="700" color="gray.800" mb={3}>KV Store</Text>
          {kvEntries && kvEntries.length > 0 ? (
            <VStack spacing={2} align="stretch">
              {kvEntries.map((e: { key: string; value: string }) => (
                <Flex key={e.key} justify="space-between" p={2} borderRadius="lg" bg="gray.50">
                  <Code fontSize="sm" bg="brand.50" color="brand.700" borderRadius="md" px={2}>{e.key}</Code>
                  <Text fontSize="sm" color="gray.600">{typeof e.value === "string" ? e.value : JSON.stringify(e.value)}</Text>
                </Flex>
              ))}
            </VStack>
          ) : <Text fontSize="sm" color="gray.400">No KV entries</Text>}
        </Box>
      </SimpleGrid>
    </Flex>
  );
}

function flagEmoji(code: string): string {
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch { return code; }
}

function CountriesPanel() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAnimeLoading);
  const countries = useAppSelector(selectAnimeCountries);
  const serverBlocked = useAppSelector(selectAnimeBlocked);
  const localBlocked = useAppSelector(selectLocalBlocked);
  const actionLoading = useAppSelector(selectCountryActionLoading);
  const [newCountry, setNewCountry] = useState("");
  const toast = useToast();

  useEffect(() => {
    dispatch(fetchAnimeDashboard());
  }, [dispatch]);

  const blocked = useMemo(() => localBlocked ?? serverBlocked, [localBlocked, serverBlocked]);

  const addBlocked = useCallback(async () => {
    if (!newCountry.trim() || newCountry.trim().length !== 2) {
      toast({ title: "Enter 2-letter country code", status: "warning", duration: 2000, position: "top-right" });
      return;
    }
    try {
      const result = await dispatch(blockCountry(newCountry.trim())).unwrap();
      setNewCountry("");
      toast({ title: `Blocked ${result}`, status: "success", duration: 2000, position: "top-right" });
    } catch (e) {
      toast({ title: "Failed to block country", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
  }, [newCountry, dispatch, toast]);

  const removeBlocked = useCallback(async (cc: string) => {
    try {
      await dispatch(unblockCountry(cc)).unwrap();
      toast({ title: `Unblocked ${cc}`, status: "success", duration: 2000, position: "top-right" });
    } catch (e) {
      toast({ title: "Failed to unblock", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
  }, [dispatch, toast]);

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  return (
    <Flex direction="column" gap={4}>
      {/* Stats */}
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
        <StatCard title="Registered Countries" value={String(countries.length)} icon={MdPublic} gradient="linear(135deg, #22c55e, #16a34a)" change="Active regions with devices" changeType="positive" />
        <StatCard title="Blocked Countries" value={String(blocked.length)} icon={MdBlock} gradient="linear(135deg, #ef4444, #dc2626)" change={blocked.length ? "FCM notifications disabled" : "None blocked"} changeType={blocked.length ? "negative" : "positive"} />
      </SimpleGrid>

      {/* Registered */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex align="center" gap={2} mb={4}>
          <Text fontSize="md" fontWeight="700" color="gray.800">Registered Countries</Text>
          <Badge bg="green.50" color="green.600" borderRadius="lg" px={2}>{countries.length}</Badge>
        </Flex>
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={2}>
          {countries.map((c) => (
            <Flex key={c} align="center" gap={2} p={2.5} borderRadius="xl" bg="gray.50" _hover={{ bg: "brand.50" }} transition="all 0.15s">
              <Text fontSize="lg">{flagEmoji(c)}</Text>
              <Box minW={0}>
                <Text fontSize="sm" fontWeight="600" color="gray.800">{c}</Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>{countryName(c)}</Text>
              </Box>
            </Flex>
          ))}
        </SimpleGrid>
        {countries.length === 0 && <Text fontSize="sm" color="gray.400">No registered countries</Text>}
      </Box>

      {/* Blocked */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex align="center" gap={2} mb={4}>
          <Text fontSize="md" fontWeight="700" color="gray.800">Blocked Countries</Text>
          <Badge bg="red.50" color="red.600" borderRadius="lg" px={2}>{blocked.length}</Badge>
        </Flex>

        <Flex gap={2} mb={4}>
          <Input
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addBlocked()}
            placeholder="e.g. IN"
            size="sm"
            borderRadius="lg"
            bg="gray.50"
            maxW="100px"
            maxLength={2}
            _focus={{ bg: "white", borderColor: "brand.500" }}
          />
          <Button size="sm" colorScheme="red" borderRadius="lg" leftIcon={<MdAdd />} onClick={addBlocked} isLoading={actionLoading} flexShrink={0}>
            Block Country
          </Button>
        </Flex>

        {blocked.length > 0 ? (
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={2}>
            {blocked.map((c) => (
              <Flex key={c} align="center" justify="space-between" p={2.5} borderRadius="xl" bg="red.50" _hover={{ bg: "red.100" }} transition="all 0.15s">
                <Flex align="center" gap={2}>
                  <Text fontSize="lg">{flagEmoji(c)}</Text>
                  <Box minW={0}>
                    <Text fontSize="sm" fontWeight="600" color="red.700">{c}</Text>
                    <Text fontSize="xs" color="red.500" noOfLines={1}>{countryName(c)}</Text>
                  </Box>
                </Flex>
                <IconButton
                  aria-label="Unblock"
                  icon={<MdDelete />}
                  size="xs"
                  variant="ghost"
                  color="red.400"
                  _hover={{ color: "red.600", bg: "red.200" }}
                  onClick={() => removeBlocked(c)}
                  isLoading={actionLoading}
                />
              </Flex>
            ))}
          </SimpleGrid>
        ) : <Text fontSize="sm" color="gray.400">No blocked countries</Text>}
      </Box>
    </Flex>
  );
}

export function AnimeDashboard() {
  const { activePage } = useApp();
  if (activePage === "scraper") return <ScraperPanel />;
  if (activePage === "reports") return <ErrorReportsPanel />;
  if (activePage === "countries") return <CountriesPanel />;
  if (activePage === "devices") return <DevicesPanel />;
  if (activePage === "analytics") return <SiteAnalyticsPanel />;
  if (activePage === "rating-feedback") return <RatingFeedbackPanel />;
  if (activePage === "kv-store") return (
    <Flex direction="column" gap={4}>
      <AppConfigForm />
      <KvStorePanel />
    </Flex>
  );
  if (activePage === "settings") return <Text color="gray.500" fontSize="sm" p={4}>Environment: .env.local</Text>;
  return <DashboardPanel />;
}
