"use client";

import { useEffect } from "react";
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
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchAnalytics,
  cleanupAnalytics,
  setAnalyticsDays,
  setAnalyticsSearch,
  selectAnalyticsDaily,
  selectAnalyticsLoading,
  selectAnalyticsDays,
  selectAnalyticsSearch,
  selectFilteredSites,
  selectTotalVisits,
  selectAnalyticsSites,
} from "@/store/slices/anime/analytics-slice";

export function SiteAnalyticsPanel() {
  const dispatch = useAppDispatch();
  const daily = useAppSelector(selectAnalyticsDaily);
  const loading = useAppSelector(selectAnalyticsLoading);
  const days = useAppSelector(selectAnalyticsDays);
  const search = useAppSelector(selectAnalyticsSearch);
  const filteredSites = useAppSelector(selectFilteredSites);
  const totalVisits = useAppSelector(selectTotalVisits);
  const allSites = useAppSelector(selectAnalyticsSites);
  const toast = useToast();

  useEffect(() => {
    dispatch(fetchAnalytics(days));
  }, [dispatch, days]);

  const handleRefresh = () => {
    dispatch(fetchAnalytics(days));
  };

  const handleCleanup = async () => {
    try {
      const deleted = await dispatch(cleanupAnalytics()).unwrap();
      toast({ title: `Cleaned up ${deleted} old records`, status: "success", duration: 3000 });
      dispatch(fetchAnalytics(days));
    } catch {
      toast({ title: "Cleanup failed", status: "error", duration: 3000 });
    }
  };

  const uniqueDomains = allSites.length;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Site Visit Analytics</Text>
        <Flex gap={2} align="center">
          <Select size="sm" w="120px" value={days} onChange={(e) => dispatch(setAnalyticsDays(e.target.value))}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </Select>
          <IconButton aria-label="Refresh" icon={<MdRefresh />} size="sm" onClick={handleRefresh} />
          <IconButton aria-label="Cleanup" icon={<MdDelete />} size="sm" colorScheme="red" variant="outline" onClick={handleCleanup} />
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
        onChange={(e) => dispatch(setAnalyticsSearch(e.target.value))}
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
