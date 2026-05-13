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
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Textarea,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { MdSave, MdRefresh } from "react-icons/md";

interface AviationConfig {
  min_app_version: string;
  latest_app_version: string;
  force_update: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement: string;
  play_store_url: string;
  support_email: string;
  privacy_url: string;
  terms_url: string;
}

const DEFAULTS: AviationConfig = {
  min_app_version: "1.0.0",
  latest_app_version: "1.0.0",
  force_update: false,
  maintenance_mode: false,
  maintenance_message: "",
  announcement: "",
  play_store_url: "",
  support_email: "",
  privacy_url: "",
  terms_url: "",
};

export function AviationConfigForm() {
  const [config, setConfig] = useState<AviationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/aviation/config");
      const data = await res.json();
      const c = data.config || {};
      setConfig({
        min_app_version: String(c.min_app_version ?? DEFAULTS.min_app_version),
        latest_app_version: String(c.latest_app_version ?? DEFAULTS.latest_app_version),
        force_update: Boolean(c.force_update ?? DEFAULTS.force_update),
        maintenance_mode: Boolean(c.maintenance_mode ?? DEFAULTS.maintenance_mode),
        maintenance_message: String(c.maintenance_message ?? ""),
        announcement: String(c.announcement ?? ""),
        play_store_url: String(c.play_store_url ?? ""),
        support_email: String(c.support_email ?? ""),
        privacy_url: String(c.privacy_url ?? ""),
        terms_url: String(c.terms_url ?? ""),
      });
    } catch {
      toast({ title: "Failed to load config", status: "error", duration: 3000, position: "top-right" });
    }
    setLoading(false);
    setDirty(false);
  }, [toast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const update = (patch: Partial<AviationConfig>) => {
    setConfig((prev) => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/db/aviation/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "Config saved", status: "success", duration: 2000, position: "top-right" });
      setDirty(false);
    } catch (e) {
      toast({ title: "Failed to save", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setSaving(false);
  };

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;
  if (!config) return <Text color="red.500" p={4}>Failed to load config</Text>;

  return (
    <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={6} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center" gap={3}>
          <Text fontSize="lg" fontWeight="700" color="gray.800">Aviation App Config</Text>
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
        {/* Version & Update */}
        <Text fontSize="sm" fontWeight="700" color="gray.700">Version & Update</Text>

        <Flex gap={6} direction={{ base: "column", md: "row" }}>
          <FormControl maxW="200px">
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Latest App Version</FormLabel>
            <Input value={config.latest_app_version} onChange={(e) => update({ latest_app_version: e.target.value })} placeholder="e.g. 1.0.1" size="sm" borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>

          <FormControl maxW="200px">
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Min App Version</FormLabel>
            <Input value={config.min_app_version} onChange={(e) => update({ min_app_version: e.target.value })} placeholder="e.g. 1.0.0" size="sm" borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>
        </Flex>

        <FormControl>
          <Flex align="center" gap={3}>
            <Switch colorScheme="red" isChecked={config.force_update} onChange={(e) => update({ force_update: e.target.checked })} size="lg" />
            <Box>
              <Text fontSize="sm" fontWeight="600" color="gray.700">Force Update</Text>
              <Text fontSize="xs" color="gray.400">
                {config.force_update ? "Users below min version will be forced to update" : "Users can continue without updating"}
              </Text>
            </Box>
          </Flex>
        </FormControl>

        <Divider />

        {/* Maintenance */}
        <Text fontSize="sm" fontWeight="700" color="gray.700">Maintenance</Text>

        <FormControl>
          <Flex align="center" gap={3}>
            <Switch colorScheme="orange" isChecked={config.maintenance_mode} onChange={(e) => update({ maintenance_mode: e.target.checked })} size="lg" />
            <Box>
              <Text fontSize="sm" fontWeight="600" color="gray.700">Maintenance Mode</Text>
              <Text fontSize="xs" color="gray.400">
                {config.maintenance_mode ? "App is in maintenance — users see a blocking screen" : "App is running normally"}
              </Text>
            </Box>
          </Flex>
        </FormControl>

        {config.maintenance_mode && (
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Maintenance Message</FormLabel>
            <Textarea value={config.maintenance_message} onChange={(e) => update({ maintenance_message: e.target.value })} placeholder="We're performing scheduled maintenance..." size="sm" borderRadius="lg" bg="gray.50" rows={2} _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>
        )}

        <Divider />

        {/* Announcement */}
        <Text fontSize="sm" fontWeight="700" color="gray.700">Announcement</Text>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight="600" color="gray.600">In-App Announcement</FormLabel>
          <Textarea value={config.announcement} onChange={(e) => update({ announcement: e.target.value })} placeholder="Shown on profile screen (leave empty to hide)" size="sm" borderRadius="lg" bg="gray.50" rows={2} _focus={{ bg: "white", borderColor: "brand.500" }} />
        </FormControl>

        <Divider />

        {/* App Info */}
        <Text fontSize="sm" fontWeight="700" color="gray.700">App Info & Links</Text>

        <Flex gap={6} direction={{ base: "column", md: "row" }}>
          <FormControl flex={1}>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Play Store URL</FormLabel>
            <Input value={config.play_store_url} onChange={(e) => update({ play_store_url: e.target.value })} placeholder="https://play.google.com/store/apps/details?id=..." size="sm" borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>

          <FormControl maxW="280px">
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Support Email</FormLabel>
            <Input value={config.support_email} onChange={(e) => update({ support_email: e.target.value })} placeholder="support@example.com" size="sm" borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>
        </Flex>

        <Flex gap={6} direction={{ base: "column", md: "row" }}>
          <FormControl flex={1}>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Privacy Policy URL</FormLabel>
            <Input value={config.privacy_url} onChange={(e) => update({ privacy_url: e.target.value })} placeholder="https://..." size="sm" borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>

          <FormControl flex={1}>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Terms of Service URL</FormLabel>
            <Input value={config.terms_url} onChange={(e) => update({ terms_url: e.target.value })} placeholder="https://..." size="sm" borderRadius="lg" bg="gray.50" _focus={{ bg: "white", borderColor: "brand.500" }} />
          </FormControl>
        </Flex>
      </VStack>
    </Box>
  );
}
