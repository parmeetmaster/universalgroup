"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Flex, Text, Button, IconButton, HStack, Badge, Code,
  Spinner, useToast, Link,
} from "@chakra-ui/react";
import { MdRefresh, MdRssFeed, MdPlayCircle, MdOpenInNew } from "react-icons/md";
import { StatCard } from "./stat-card";

interface Episode {
  url: string;
  first_seen_at: string;
  created_at: string;
}

export function ScraperPanel() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/anime/scrape");
      const data = await res.json();
      setEpisodes(data.recentEpisodes || []);
      setTotal(data.totalEpisodes || 0);
    } catch {
      toast({ title: "Failed to load scraper data", status: "error", duration: 3000, position: "top-right" });
    }
    setLoading(false);
  }, [toast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  const triggerScrape = async () => {
    setScraping(true);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/db/anime/scrape", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error("Scrape failed");
      setScrapeResult(JSON.stringify(data.data, null, 2));
      toast({ title: "Scrape completed", status: "success", duration: 2000, position: "top-right" });
      await loadData();
    } catch (e) {
      toast({ title: "Scrape failed", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setScraping(false);
  };

  const truncateUrl = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname.length > 40 ? u.pathname.slice(0, 40) + "..." : u.pathname;
      return u.hostname + path;
    } catch { return url.length > 60 ? url.slice(0, 60) + "..." : url; }
  };

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  return (
    <Flex direction="column" gap={4}>
      {/* Header */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={2}>
            <Text fontSize="lg" fontWeight="700" color="gray.800">Scraper</Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{total} episodes</Badge>
          </Flex>
          <HStack spacing={2}>
            <Button size="sm" variant="ghost" borderRadius="lg" leftIcon={<MdRefresh />} onClick={loadData} color="gray.500" _hover={{ color: "brand.600" }}>
              Refresh
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Stats + Action */}
      <Flex gap={4} direction={{ base: "column", md: "row" }}>
        <Box flex="1">
          <StatCard title="Total Episodes" value={String(total)} icon={MdRssFeed} />
        </Box>
        <Flex flex="1" bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)" align="center" justify="center" direction="column" gap={3}>
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">Scraper Actions</Text>
          <Button colorScheme="brand" borderRadius="lg" leftIcon={<MdPlayCircle />} onClick={triggerScrape} isLoading={scraping} loadingText="Scraping...">
            Trigger Scrape
          </Button>
        </Flex>
      </Flex>

      {/* Scrape Result */}
      {scrapeResult && (
        <Box bg="white" border="1px" borderColor="brand.200" borderRadius="2xl" p={5} boxShadow="0 4px 12px rgba(124, 58, 237, 0.08)">
          <Text fontSize="sm" fontWeight="700" color="gray.800" mb={3}>Scrape Result</Text>
          <Code display="block" p={3} borderRadius="lg" fontSize="xs" whiteSpace="pre-wrap" bg="gray.50" maxH="200px" overflowY="auto" wordBreak="break-all">
            {scrapeResult}
          </Code>
        </Box>
      )}

      {/* Recent Episodes */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Text fontSize="sm" fontWeight="700" color="gray.800" mb={3}>Recent Episodes</Text>
        <Box maxH="400px" overflowY="auto" borderRadius="lg">
          {episodes.length === 0 ? (
            <Text color="gray.400" fontSize="sm" textAlign="center" py={4}>No episodes found.</Text>
          ) : (
            <Flex direction="column" gap={2}>
              {episodes.map((ep, i) => (
                <Flex key={i} align="center" justify="space-between" p={3} bg="gray.50" borderRadius="lg" _hover={{ bg: "brand.50" }} transition="all 0.15s">
                  <Flex direction="column" gap={0.5} flex="1" minW={0}>
                    <Link href={ep.url} isExternal color="brand.600" fontSize="sm" fontWeight="500" noOfLines={1} _hover={{ color: "brand.800" }}>
                      {truncateUrl(ep.url)} <IconButton as="span" aria-label="Open" icon={<MdOpenInNew />} size="xs" variant="unstyled" display="inline" minW={0} />
                    </Link>
                    <HStack spacing={3}>
                      <Text fontSize="xs" color="gray.400">Seen: {new Date(ep.first_seen_at).toLocaleDateString()}</Text>
                      <Text fontSize="xs" color="gray.400">Created: {new Date(ep.created_at).toLocaleDateString()}</Text>
                    </HStack>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
