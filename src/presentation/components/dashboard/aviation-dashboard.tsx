"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SimpleGrid,
  Box,
  Flex,
  Text,
  Badge,
  VStack,
  Icon,
  Spinner,
  Button,
  HStack,
} from "@chakra-ui/react";
import {
  MdOndemandVideo,
  MdNotifications,
  MdPlayCircle,
  MdRefresh,
  MdNewspaper,
  MdOpenInNew,
} from "react-icons/md";
import { useApp } from "@/presentation/providers/app-context";
import { useDb } from "@/presentation/hooks/use-db";
import { StatCard } from "./stat-card";
import { AviationConfigForm } from "./aviation-config-form";

interface AviationData {
  stats: { totalShorts: number; totalNotifications: number };
  youtubeShorts: Array<{ id: string; title: string; youtubeUrl: string; thumbnailUrl: string; createdAt: string }>;
}

interface Notification {
  id: number;
  title?: string;
  body?: string;
  article_url?: string;
  topic?: string;
  created_at?: string;
}

function DashboardPanel() {
  const { data, loading } = useDb<AviationData>("aviation");

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  const s = data?.stats;

  return (
    <Flex direction="column" gap={5}>
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
        <StatCard title="YouTube Shorts" value={String(s?.totalShorts || 0)} icon={MdOndemandVideo} gradient="linear(135deg, #ef4444, #dc2626)" change="Auto-fetched daily" changeType="positive" />
        <StatCard title="Notifications Sent" value={String(s?.totalNotifications || 0)} icon={MdNotifications} gradient="linear(135deg, #a855f7, #7c3aed)" change="Total push notifications" changeType="neutral" />
      </SimpleGrid>

      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex align="center" gap={2} mb={4}>
          <Text fontSize="md" fontWeight="700" color="gray.800">YouTube Shorts</Text>
          <Badge bg="red.50" color="red.600" borderRadius="lg" px={2}>{data?.youtubeShorts?.length || 0}</Badge>
        </Flex>
        <VStack spacing={2} align="stretch" maxH="500px" overflowY="auto">
          {data?.youtubeShorts?.map((s) => (
            <Flex key={s.id} align="center" gap={3} p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "red.50" }} transition="all 0.15s" cursor="pointer" onClick={() => window.open(s.youtubeUrl, "_blank")}>
              <Flex align="center" justify="center" w={8} h={8} borderRadius="lg" bg="red.50" flexShrink={0}>
                <Icon as={MdPlayCircle} boxSize={5} color="red.500" />
              </Flex>
              <Box flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{s.title}</Text>
                <Text fontSize="xs" color="gray.400" noOfLines={1}>{s.youtubeUrl}</Text>
              </Box>
              <Icon as={MdOpenInNew} boxSize={4} color="gray.300" />
            </Flex>
          ))}
          {(!data?.youtubeShorts || data.youtubeShorts.length === 0) && (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No YouTube shorts yet</Text>
          )}
        </VStack>
      </Box>
    </Flex>
  );
}

function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/aviation/notifications?limit=${limit}&offset=${offset}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
    } catch { /* empty */ }
    setLoading(false);
  }, [offset]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  return (
    <Flex direction="column" gap={4}>
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex justify="space-between" align="center" mb={4}>
          <Flex align="center" gap={2}>
            <Text fontSize="lg" fontWeight="700" color="gray.800">Sent Notifications</Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{total}</Badge>
          </Flex>
          <Button size="sm" variant="ghost" borderRadius="lg" leftIcon={<MdRefresh />} onClick={load} color="gray.500">Refresh</Button>
        </Flex>

        <VStack spacing={2} align="stretch" maxH="600px" overflowY="auto">
          {notifications.map((n) => (
            <Box key={n.id} p={3} borderRadius="xl" bg="gray.50" _hover={{ bg: "brand.50" }} transition="all 0.15s">
              <Flex align="center" gap={2} mb={1}>
                <Icon as={MdNotifications} boxSize={4} color="brand.500" />
                <Text fontSize="sm" fontWeight="600" color="gray.800" noOfLines={1}>{n.title || "Notification"}</Text>
                {n.topic && <Badge fontSize="xs" bg="blue.50" color="blue.600" borderRadius="lg">{n.topic}</Badge>}
              </Flex>
              {n.body && <Text fontSize="xs" color="gray.600" noOfLines={2} ml={6}>{n.body}</Text>}
              <Flex justify="space-between" mt={1} ml={6}>
                {n.article_url && (
                  <Text fontSize="xs" color="brand.500" cursor="pointer" _hover={{ textDecor: "underline" }} onClick={() => window.open(n.article_url, "_blank")} noOfLines={1}>{n.article_url}</Text>
                )}
                {n.created_at && <Text fontSize="xs" color="gray.400">{new Date(n.created_at).toLocaleString()}</Text>}
              </Flex>
            </Box>
          ))}
          {notifications.length === 0 && <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>No notifications sent yet</Text>}
        </VStack>

        {total > limit && (
          <HStack justify="center" mt={4} spacing={2}>
            <Button size="xs" variant="outline" borderRadius="lg" onClick={() => setOffset(Math.max(0, offset - limit))} isDisabled={offset === 0}>Prev</Button>
            <Text fontSize="xs" color="gray.500">{offset + 1}-{Math.min(offset + limit, total)} of {total}</Text>
            <Button size="xs" variant="outline" borderRadius="lg" onClick={() => setOffset(offset + limit)} isDisabled={offset + limit >= total}>Next</Button>
          </HStack>
        )}
      </Box>
    </Flex>
  );
}

function ArticlesPanel() {
  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      <Flex align="center" gap={2} mb={3}>
        <Icon as={MdNewspaper} boxSize={5} color="brand.500" />
        <Text fontSize="md" fontWeight="700" color="gray.800">Articles</Text>
      </Flex>
      <Text fontSize="sm" color="gray.600">
        Articles are scraped live from AviationA2Z and SimpleFlying via the backend scraper.
        They are served directly through the aviation API and not stored in MySQL.
      </Text>
      <Text fontSize="sm" color="gray.500" mt={2}>
        Endpoint: aviation.animekill.com/api
      </Text>
    </Box>
  );
}

export function AviationDashboard() {
  const { activePage } = useApp();
  if (activePage === "youtube-shorts") return <DashboardPanel />;
  if (activePage === "articles") return <ArticlesPanel />;
  if (activePage === "notifications") return <NotificationsPanel />;
  if (activePage === "settings") return <AviationConfigForm />;
  return <DashboardPanel />;
}
