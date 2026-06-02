"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Badge,
  Select,
  Button,
  useToast,
  Input,
  IconButton,
} from "@chakra-ui/react";
import { MdRefresh, MdContentCopy, MdDelete } from "react-icons/md";

interface TopSite {
  domain: string;
  total_visits: number;
  total_devices: number;
  last_seen: string;
}

interface DailyStat {
  date: string;
  domains: number;
  visits: number;
}

export function SiteAnalyticsPanel() {
  const [sites, setSites] = useState<TopSite[]>([]);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [search, setSearch] = useState("");
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("universal_dashboard_auth") || "{}").token;
      const headers: Record<string, string> = { "X-Admin-Token": token || "" };

      const [sitesRes, dailyRes] = await Promise.all([
        fetch(`/api/anime-downloader/admin/analytics/top-sites?days=${days}&limit=100`, { headers }),
        fetch(`/api/anime-downloader/admin/analytics/daily?days=${days}`, { headers }),
      ]);

      if (sitesRes.ok) {
        const data = await sitesRes.json();
        setSites(data.items || []);
      }
      if (dailyRes.ok) {
        const data = await dailyRes.json();
        setDaily(data || []);
      }
    } catch (e) {
      toast({ title: "Failed to fetch analytics", status: "error", duration: 3000 });
    }
    setLoading(false);
  }, [days, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cleanup = async () => {
    const token = JSON.parse(localStorage.getItem("universal_dashboard_auth") || "{}").token;
    const res = await fetch(`/api/anime-downloader/admin/analytics/cleanup?days=90`, {
      method: "DELETE",
      headers: { "X-Admin-Token": token || "" },
    });
    if (res.ok) {
      const data = await res.json();
      toast({ title: `Cleaned up ${data.deleted} old records`, status: "success", duration: 3000 });
      fetchData();
    }
  };

  const filteredSites = search
    ? sites.filter((s) => s.domain.includes(search.toLowerCase()))
    : sites;

  const totalVisits = sites.reduce((sum, s) => sum + Number(s.total_visits), 0);
  const uniqueDomains = sites.length;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Site Visit Analytics</Text>
        <Flex gap={2} align="center">
          <Select size="sm" w="120px" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </Select>
          <IconButton aria-label="Refresh" icon={<MdRefresh />} size="sm" onClick={fetchData} />
          <IconButton aria-label="Cleanup" icon={<MdDelete />} size="sm" colorScheme="red" variant="outline" onClick={cleanup} />
        </Flex>
      </Flex>

      <Flex gap={4} mb={4}>
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={4} flex={1}>
          <Text fontSize="2xl" fontWeight="bold">{totalVisits.toLocaleString()}</Text>
          <Text fontSize="sm" color="gray.500">Total Visits</Text>
        </Box>
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={4} flex={1}>
          <Text fontSize="2xl" fontWeight="bold">{uniqueDomains}</Text>
          <Text fontSize="sm" color="gray.500">Unique Domains</Text>
        </Box>
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={4} flex={1}>
          <Text fontSize="2xl" fontWeight="bold">{daily.length}</Text>
          <Text fontSize="sm" color="gray.500">Active Days</Text>
        </Box>
      </Flex>

      <Input
        placeholder="Search domains..."
        size="sm"
        mb={3}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Flex justify="center" py={8}><Spinner /></Flex>
      ) : (
        <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" overflow="hidden">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Domain</Th>
                <Th isNumeric>Visits</Th>
                <Th isNumeric>Devices</Th>
                <Th>Last Seen</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredSites.map((site, i) => (
                <Tr key={site.domain} _hover={{ bg: "gray.50" }}>
                  <Td color="gray.400">{i + 1}</Td>
                  <Td fontWeight="medium">{site.domain}</Td>
                  <Td isNumeric>
                    <Badge colorScheme="purple">{Number(site.total_visits).toLocaleString()}</Badge>
                  </Td>
                  <Td isNumeric>{site.total_devices}</Td>
                  <Td color="gray.500" fontSize="xs">{site.last_seen}</Td>
                  <Td>
                    <IconButton
                      aria-label="Copy"
                      icon={<MdContentCopy />}
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${site.domain}`);
                        toast({ title: "Copied!", duration: 1000 });
                      }}
                    />
                  </Td>
                </Tr>
              ))}
              {filteredSites.length === 0 && (
                <Tr><Td colSpan={6} textAlign="center" color="gray.400" py={8}>No data yet</Td></Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
