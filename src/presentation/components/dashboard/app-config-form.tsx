"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Switch,
  Button,
  VStack,
  HStack,
  IconButton,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  TagCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { MdSave, MdAdd, MdRefresh, MdDelete, MdDragIndicator } from "react-icons/md";

interface BlockedUrl {
  url: string;
}

interface TopSite {
  name: string;
  url: string;
}

interface AppConfig {
  app_version: string;
  update_build_version: number;
  force_update: boolean;
  blocked_urls: BlockedUrl[];
  force_update_after_version: number;
  trends: string[];
  top_sites: TopSite[];
  blocked_regions: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDeepString(val: string): any {
  if (!val) return val;
  try {
    let parsed = val;
    // Keep parsing until we get a non-string result or it fails
    while (typeof parsed === "string") {
      const next = JSON.parse(parsed);
      if (typeof next === "string") parsed = next;
      else return next;
    }
    return parsed;
  } catch {
    return val;
  }
}

function parseConfig(raw: string): AppConfig {
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;

  let blockedUrls: BlockedUrl[] = [];
  try {
    const parsed = parseDeepString(obj.blocked_urls);
    if (Array.isArray(parsed)) {
      blockedUrls = parsed.filter((u: BlockedUrl) => u && u.url);
    }
  } catch {}

  let trends: string[] = [];
  try {
    const parsed = parseDeepString(obj.trends);
    if (Array.isArray(parsed)) {
      trends = parsed.filter(Boolean);
    }
  } catch {}

  let topSites: TopSite[] = [];
  try {
    const parsed = parseDeepString(obj.top_sites);
    if (Array.isArray(parsed)) {
      topSites = parsed.filter((s: TopSite) => s && s.name && s.url);
    }
  } catch {}

  let blockedRegions: string[] = [];
  try {
    const parsed = parseDeepString(obj.blocked_regions);
    if (Array.isArray(parsed)) {
      blockedRegions = parsed.filter(Boolean);
    }
  } catch {}

  return {
    app_version: obj.app_version || "",
    update_build_version: Number(obj.update_build_version) || 0,
    force_update: Boolean(obj.force_update),
    blocked_urls: blockedUrls,
    force_update_after_version: Number(obj.force_update_after_version) || 0,
    trends,
    top_sites: topSites,
    blocked_regions: blockedRegions,
  };
}

function configToJson(config: AppConfig): string {
  return JSON.stringify({
    app_version: config.app_version,
    update_build_version: config.update_build_version,
    force_update: config.force_update,
    blocked_urls: JSON.stringify(config.blocked_urls),
    force_update_after_version: config.force_update_after_version,
    trends: JSON.stringify(config.trends),
    top_sites: JSON.stringify(config.top_sites),
    blocked_regions: JSON.stringify(config.blocked_regions),
  });
}

export function AppConfigForm() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTrend, setNewTrend] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [dirty, setDirty] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/anime/kv");
      const data = await res.json();
      const entry = data.entries?.find((e: { key: string; value: string }) => e.key === "app_config");
      if (entry) {
        setConfig(parseConfig(entry.value));
      } else {
        setConfig({
          app_version: "1.0.0",
          update_build_version: 1,
          force_update: false,
          blocked_urls: [],
          force_update_after_version: 1,
          trends: [],
          top_sites: [],
          blocked_regions: [],
        });
      }
    } catch {
      toast({ title: "Failed to load config", status: "error", duration: 3000, position: "top-right" });
    }
    setLoading(false);
    setDirty(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const update = (patch: Partial<AppConfig>) => {
    setConfig((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  };

  const saveConfig = useCallback(async (cfg: AppConfig) => {
    setSaving(true);
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "app_config", value: configToJson(cfg) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Config saved", status: "success", duration: 2000, position: "top-right" });
      setDirty(false);
    } catch (e) {
      toast({ title: "Failed to save", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setSaving(false);
  }, [toast]);

  const save = () => { if (config) saveConfig(config); };

  const addUrl = () => {
    if (!newUrl.trim() || !config) return;
    update({ blocked_urls: [...config.blocked_urls, { url: newUrl.trim() }] });
    setNewUrl("");
  };

  const removeUrl = (index: number) => {
    if (!config) return;
    update({ blocked_urls: config.blocked_urls.filter((_, i) => i !== index) });
  };

  const addRegion = () => {
    if (!newRegion.trim() || !config) return;
    update({ blocked_regions: [...config.blocked_regions, newRegion.trim()] });
    setNewRegion("");
  };

  const removeRegion = (index: number) => {
    if (!config) return;
    update({ blocked_regions: config.blocked_regions.filter((_, i) => i !== index) });
  };

  const addTrend = () => {
    if (!newTrend.trim() || !config) return;
    update({ trends: [...config.trends, newTrend.trim()] });
    setNewTrend("");
  };

  const removeTrend = (index: number) => {
    if (!config) return;
    update({ trends: config.trends.filter((_, i) => i !== index) });
  };

  const addSite = () => {
    if (!newSiteName.trim() || !newSiteUrl.trim() || !config) return;
    update({ top_sites: [...config.top_sites, { name: newSiteName.trim(), url: newSiteUrl.trim() }] });
    setNewSiteName("");
    setNewSiteUrl("");
  };

  const removeSite = (index: number) => {
    if (!config) return;
    update({ top_sites: config.top_sites.filter((_, i) => i !== index) });
  };

  const handleDrop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx || !config) return;
    const items = [...config.top_sites];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(toIdx, 0, moved);
    const updated = { ...config, top_sites: items };
    setConfig(updated);
    setDirty(false);
    setDragIdx(null);
    setDragOverIdx(null);
    saveConfig(updated);
  };

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;
  if (!config) return <Text color="red.500" p={4}>Failed to load config</Text>;

  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={6} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center" gap={3}>
          <Text fontSize="lg" fontWeight="700" color="gray.800">App Config</Text>
          {dirty && <Badge bg="orange.50" color="orange.600" borderRadius="lg" px={2} fontSize="xs">Unsaved changes</Badge>}
        </Flex>
        <HStack spacing={2}>
          <Button size="sm" variant="ghost" borderRadius="lg" leftIcon={<MdRefresh />} onClick={load} color="gray.500">Reload</Button>
          <Button size="sm" colorScheme="brand" borderRadius="lg" leftIcon={<MdSave />} onClick={save} isLoading={saving} isDisabled={!dirty}>
            Save Changes
          </Button>
        </HStack>
      </Flex>

      <VStack spacing={5} align="stretch">
        {/* App Version */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="600" color="gray.600">App Version</FormLabel>
          <Input
            value={config.app_version}
            onChange={(e) => update({ app_version: e.target.value })}
            placeholder="e.g. 1.0.0"
            size="sm"
            borderRadius="lg"
            bg="gray.50"
            maxW="200px"
            _focus={{ bg: "white", borderColor: "brand.500" }}
          />
        </FormControl>

        <Divider />

        {/* Build Versions */}
        <Flex gap={6} direction={{ base: "column", md: "row" }}>
          <FormControl maxW="220px">
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Update Build Version</FormLabel>
            <NumberInput
              value={config.update_build_version}
              onChange={(_, val) => update({ update_build_version: val || 0 })}
              min={1}
              size="sm"
            >
              <NumberInputField borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl maxW="220px">
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Force Update After Version</FormLabel>
            <NumberInput
              value={config.force_update_after_version}
              onChange={(_, val) => update({ force_update_after_version: val || 0 })}
              min={1}
              size="sm"
            >
              <NumberInputField borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </Flex>

        <Divider />

        {/* Force Update Toggle */}
        <FormControl>
          <Flex align="center" gap={3}>
            <Switch
              colorScheme="brand"
              isChecked={config.force_update}
              onChange={(e) => update({ force_update: e.target.checked })}
              size="lg"
            />
            <Box>
              <Text fontSize="sm" fontWeight="600" color="gray.700">Force Update</Text>
              <Text fontSize="xs" color="gray.400">
                {config.force_update ? "Users will be forced to update the app" : "Users can skip the update"}
              </Text>
            </Box>
          </Flex>
        </FormControl>

        <Divider />

        {/* Blocked URLs */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
            Blocked URLs
            <Badge ml={2} bg="gray.100" color="gray.600" borderRadius="lg" fontSize="xs">{config.blocked_urls.length}</Badge>
          </FormLabel>

          {config.blocked_urls.length > 0 && (
            <VStack spacing={2} align="stretch" mb={3}>
              {config.blocked_urls.map((u, i) => (
                <Flex key={i} align="center" gap={2} p={2} bg="gray.50" borderRadius="lg">
                  <Text fontSize="sm" color="gray.700" flex={1} noOfLines={1}>{u.url}</Text>
                  <IconButton aria-label="Remove" icon={<MdDelete />} size="xs" variant="ghost" color="red.400" _hover={{ bg: "red.50" }} onClick={() => removeUrl(i)} />
                </Flex>
              ))}
            </VStack>
          )}

          <Flex gap={2}>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="https://example.com"
              size="sm"
              borderRadius="lg"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "brand.500" }}
            />
            <Button size="sm" variant="outline" colorScheme="brand" borderRadius="lg" leftIcon={<MdAdd />} onClick={addUrl} flexShrink={0}>
              Add
            </Button>
          </Flex>
        </FormControl>

        <Divider />

        {/* Blocked Regions */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
            Blocked Regions
            <Badge ml={2} bg="gray.100" color="gray.600" borderRadius="lg" fontSize="xs">{config.blocked_regions.length}</Badge>
          </FormLabel>
          <Text fontSize="xs" color="gray.400" mb={2}>Regions/countries where top sites open via Google search instead of direct URL</Text>

          {config.blocked_regions.length > 0 && (
            <Flex wrap="wrap" gap={2} mb={3}>
              {config.blocked_regions.map((r, i) => (
                <Tag key={i} size="md" borderRadius="full" variant="subtle" colorScheme="orange">
                  <TagLabel>{r}</TagLabel>
                  <TagCloseButton onClick={() => removeRegion(i)} />
                </Tag>
              ))}
            </Flex>
          )}

          <Flex gap={2}>
            <Input
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRegion()}
              placeholder="e.g. Uttar Pradesh or IN"
              size="sm"
              borderRadius="lg"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "brand.500" }}
            />
            <Button size="sm" variant="outline" colorScheme="brand" borderRadius="lg" leftIcon={<MdAdd />} onClick={addRegion} flexShrink={0}>
              Add
            </Button>
          </Flex>
        </FormControl>

        <Divider />

        {/* Trends */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
            Search Trends
            <Badge ml={2} bg="gray.100" color="gray.600" borderRadius="lg" fontSize="xs">{config.trends.length}</Badge>
          </FormLabel>

          {config.trends.length > 0 && (
            <Flex flexWrap="wrap" gap={2} mb={3}>
              {config.trends.map((t, i) => (
                <Tag key={i} size="md" borderRadius="lg" bg="brand.50" color="brand.700" px={3} py={1}>
                  <TagLabel fontSize="sm">{t}</TagLabel>
                  <TagCloseButton onClick={() => removeTrend(i)} />
                </Tag>
              ))}
            </Flex>
          )}

          <Flex gap={2}>
            <Input
              value={newTrend}
              onChange={(e) => setNewTrend(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTrend()}
              placeholder="e.g. gogoanime one piece"
              size="sm"
              borderRadius="lg"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "brand.500" }}
            />
            <Button size="sm" variant="outline" colorScheme="brand" borderRadius="lg" leftIcon={<MdAdd />} onClick={addTrend} flexShrink={0}>
              Add
            </Button>
          </Flex>
        </FormControl>

        <Divider />

        {/* Top Sites */}
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="600" color="gray.600">
            Top Sites (Popular Sites)
            <Badge ml={2} bg="gray.100" color="gray.600" borderRadius="lg" fontSize="xs">{config.top_sites.length}</Badge>
          </FormLabel>

          {config.top_sites.length > 0 && (
            <VStack spacing={1} align="stretch" mb={3}>
              {config.top_sites.map((s, i) => (
                <Flex
                  key={`${s.name}-${s.url}`}
                  align="center"
                  gap={2}
                  p={2}
                  bg={dragOverIdx === i ? "brand.50" : "gray.50"}
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={dragOverIdx === i ? "brand.300" : "transparent"}
                  opacity={dragIdx === i ? 0.4 : 1}
                  cursor="grab"
                  transition="all 0.15s"
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                >
                  <Box color="gray.400" cursor="grab" flexShrink={0}><MdDragIndicator /></Box>
                  <Text fontSize="sm" fontWeight="600" color="gray.800" minW="80px">{s.name}</Text>
                  <Text fontSize="sm" color="gray.500" flex={1} noOfLines={1}>{s.url}</Text>
                  <IconButton aria-label="Remove" icon={<MdDelete />} size="xs" variant="ghost" color="red.400" _hover={{ bg: "red.50" }} onClick={() => removeSite(i)} />
                </Flex>
              ))}
            </VStack>
          )}

          <Flex gap={2}>
            <Input
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              placeholder="Name (e.g. GoGoAnime)"
              size="sm"
              borderRadius="lg"
              bg="gray.50"
              maxW="180px"
              _focus={{ bg: "white", borderColor: "brand.500" }}
            />
            <Input
              value={newSiteUrl}
              onChange={(e) => setNewSiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSite()}
              placeholder="https://example.com"
              size="sm"
              borderRadius="lg"
              bg="gray.50"
              flex={1}
              _focus={{ bg: "white", borderColor: "brand.500" }}
            />
            <Button size="sm" variant="outline" colorScheme="brand" borderRadius="lg" leftIcon={<MdAdd />} onClick={addSite} flexShrink={0}>
              Add
            </Button>
          </Flex>
        </FormControl>
      </VStack>
    </Box>
  );
}
