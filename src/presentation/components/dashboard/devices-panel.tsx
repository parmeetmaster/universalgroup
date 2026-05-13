"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  SimpleGrid,
  Spinner,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import {
  MdDevices,
  MdCheckCircle,
  MdDeleteForever,
  MdPercent,
  MdRefresh,
  MdPhoneAndroid,
} from "react-icons/md";
import { StatCard } from "./stat-card";

interface DailyInstall {
  date: string;
  count: string;
}

interface Device {
  id: number;
  fcm_token: string;
  country: string | null;
  app_version: string | null;
  device_model: string | null;
  status: "active" | "uninstalled";
  ping_failures: number;
  registered_at: string;
  last_active_at: string | null;
  uninstalled_at: string | null;
}

interface DevicesData {
  stats: { total: number; active: number; uninstalled: number; uninstallRate: number };
  dailyInstalls: DailyInstall[];
  devices: Device[];
  pagination: { total: number; page: number; limit: number };
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function DailyChart({ data }: { data: DailyInstall[] }) {
  if (!data || data.length === 0) {
    return (
      <Text fontSize="sm" color="gray.400">
        No install data for last 30 days
      </Text>
    );
  }
  const max = Math.max(...data.map((d) => Number(d.count)));
  return (
    <Flex align="flex-end" gap="3px" h="60px" w="100%">
      {data.map((d) => {
        const h = max > 0 ? Math.max(4, Math.round((Number(d.count) / max) * 60)) : 4;
        return (
          <Tooltip
            key={d.date}
            label={`${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d.count}`}
            placement="top"
            hasArrow
          >
            <Box
              flex={1}
              bg="brand.400"
              borderRadius="2px 2px 0 0"
              h={`${h}px`}
              opacity={0.8}
              _hover={{ opacity: 1, bg: "brand.600" }}
              cursor="default"
              transition="all 0.1s"
            />
          </Tooltip>
        );
      })}
    </Flex>
  );
}

export function DevicesPanel() {
  const [data, setData] = useState<DevicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pinging, setPinging] = useState(false);
  const toast = useToast();

  const load = useCallback(
    async (p = page, sf = statusFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: "20" });
        if (sf !== "all") params.set("status", sf);
        const res = await fetch(`/api/db/anime/devices?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (e) {
        toast({ title: "Failed to load devices", description: String(e), status: "error", duration: 3000, position: "top-right" });
      }
      setLoading(false);
    },
    [page, statusFilter, toast]
  );

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const pingAll = async () => {
    setPinging(true);
    try {
      const res = await fetch("/api/db/anime/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ping" }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      toast({
        title: "Ping complete",
        description: `${d.total} pinged — ${d.uninstalled} uninstalled detected`,
        status: "success",
        duration: 5000,
        position: "top-right",
      });
      load();
    } catch (e) {
      toast({ title: "Ping failed", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setPinging(false);
  };

  const handleFilter = (sf: string) => {
    setStatusFilter(sf);
    setPage(1);
    load(1, sf);
  };

  const s = data?.stats;
  const totalPages = data ? Math.ceil(data.pagination.total / 20) : 1;

  return (
    <Flex direction="column" gap={5}>
      {/* Stats */}
      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4}>
        <StatCard
          title="Total Registered"
          value={String(s?.total || 0)}
          icon={MdDevices}
          gradient="linear(135deg, #a855f7, #7c3aed)"
          change="All-time installs"
          changeType="neutral"
        />
        <StatCard
          title="Active Devices"
          value={String(s?.active || 0)}
          icon={MdCheckCircle}
          gradient="linear(135deg, #22c55e, #16a34a)"
          change="FCM reachable"
          changeType="positive"
        />
        <StatCard
          title="Uninstalled"
          value={String(s?.uninstalled || 0)}
          icon={MdDeleteForever}
          gradient="linear(135deg, #ef4444, #dc2626)"
          change={s?.uninstalled ? "Detected via ping" : "None detected"}
          changeType={s?.uninstalled ? "negative" : "positive"}
        />
        <StatCard
          title="Uninstall Rate"
          value={`${s?.uninstallRate || 0}%`}
          icon={MdPercent}
          gradient="linear(135deg, #f97316, #ea580c)"
          change="Of all registered"
          changeType={
            (s?.uninstallRate || 0) > 30
              ? "negative"
              : (s?.uninstallRate || 0) > 10
              ? "neutral"
              : "positive"
          }
        />
      </SimpleGrid>

      {/* Daily Installs Chart */}
      <Box
        bg="white"
        border="1px"
        borderColor="gray.100"
        borderRadius="2xl"
        p={5}
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Text fontSize="md" fontWeight="700" color="gray.800">
              Daily Installs
            </Text>
            <Text fontSize="xs" color="gray.400">
              Last 30 days
            </Text>
          </Box>
          <Button
            size="sm"
            colorScheme="brand"
            variant="outline"
            leftIcon={<MdRefresh />}
            borderRadius="lg"
            onClick={() => load()}
            isLoading={loading}
          >
            Refresh
          </Button>
        </Flex>
        {loading && !data ? (
          <Flex justify="center" py={4}>
            <Spinner color="brand.500" size="sm" />
          </Flex>
        ) : (
          <DailyChart data={data?.dailyInstalls || []} />
        )}
      </Box>

      {/* Controls + Ping */}
      <Flex gap={3} align="center" flexWrap="wrap">
        <Select
          size="sm"
          borderRadius="lg"
          w="160px"
          bg="white"
          value={statusFilter}
          onChange={(e) => handleFilter(e.target.value)}
        >
          <option value="all">All Devices</option>
          <option value="active">Active Only</option>
          <option value="uninstalled">Uninstalled</option>
        </Select>
        <Box flex={1} />
        <Button
          size="sm"
          colorScheme="brand"
          leftIcon={<MdPhoneAndroid />}
          borderRadius="lg"
          onClick={pingAll}
          isLoading={pinging}
          loadingText="Pinging..."
        >
          Ping All Devices
        </Button>
      </Flex>

      {/* Devices Table */}
      <Box
        bg="white"
        border="1px"
        borderColor="gray.100"
        borderRadius="2xl"
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
        overflow="hidden"
      >
        <Flex px={5} py={4} align="center" gap={2} borderBottom="1px" borderColor="gray.50">
          <Text fontSize="md" fontWeight="700" color="gray.800">
            Device Tokens
          </Text>
          <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>
            {data?.pagination.total || 0}
          </Badge>
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner color="brand.500" />
          </Flex>
        ) : !data?.devices?.length ? (
          <Text fontSize="sm" color="gray.400" p={5}>
            No devices found
          </Text>
        ) : (
          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Token</Th>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Country</Th>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Status</Th>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Device</Th>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Version</Th>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Registered</Th>
                  <Th color="gray.500" fontWeight="600" fontSize="xs">Last Active</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(data.devices as Device[]).map((d) => (
                  <Tr key={d.id} _hover={{ bg: "gray.50" }} transition="background 0.1s">
                    <Td>
                      <Tooltip label={d.fcm_token} placement="top" hasArrow>
                        <Text
                          fontSize="xs"
                          fontFamily="mono"
                          color="gray.600"
                          maxW="120px"
                          isTruncated
                        >
                          {d.fcm_token.slice(0, 20)}…
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td>
                      {d.country ? (
                        <Flex align="center" gap={1}>
                          <Text fontSize="md">{flagEmoji(d.country)}</Text>
                          <Text fontSize="xs" color="gray.600">
                            {d.country}
                          </Text>
                        </Flex>
                      ) : (
                        <Text fontSize="xs" color="gray.300">—</Text>
                      )}
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={d.status === "active" ? "green" : "red"}
                        borderRadius="lg"
                        px={2}
                        fontSize="xs"
                      >
                        {d.status}
                      </Badge>
                      {d.ping_failures > 0 && (
                        <Badge ml={1} colorScheme="orange" borderRadius="lg" px={2} fontSize="xs">
                          {d.ping_failures} fails
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Text fontSize="xs" color="gray.600" maxW="140px" isTruncated>
                        {d.device_model || "—"}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="xs" color="gray.600">
                        {d.app_version || "—"}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="xs" color="gray.500">
                        {fmt(d.registered_at)}
                      </Text>
                    </Td>
                    <Td>
                      <Text
                        fontSize="xs"
                        color={d.status === "uninstalled" ? "red.400" : "gray.500"}
                      >
                        {d.status === "uninstalled" ? fmt(d.uninstalled_at) : fmt(d.last_active_at)}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="center" gap={2} p={4} borderTop="1px" borderColor="gray.50">
            <Button
              size="xs"
              borderRadius="lg"
              isDisabled={page <= 1}
              onClick={() => {
                setPage(page - 1);
                load(page - 1);
              }}
            >
              ←
            </Button>
            <Text fontSize="xs" color="gray.500" alignSelf="center">
              {page} / {totalPages}
            </Text>
            <Button
              size="xs"
              borderRadius="lg"
              isDisabled={page >= totalPages}
              onClick={() => {
                setPage(page + 1);
                load(page + 1);
              }}
            >
              →
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
