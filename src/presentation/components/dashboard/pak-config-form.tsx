"use client";

import { useEffect } from "react";
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
import { useAppDispatch, useAppSelector } from "@/store";
import { pakConfigActions, pakConfigThunks, pakConfigSelectors } from "@/store/slices/pak/config-slice";

interface PakConfig {
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

export function PakConfigForm() {
  const dispatch = useAppDispatch();
  const rawConfig = useAppSelector(pakConfigSelectors.selectConfig);
  const loading = useAppSelector(pakConfigSelectors.selectLoading) as boolean;
  const saving = useAppSelector(pakConfigSelectors.selectSaving) as boolean;
  const dirty = useAppSelector(pakConfigSelectors.selectDirty) as boolean;
  const toast = useToast();

  const config = rawConfig as PakConfig | null;

  useEffect(() => { dispatch(pakConfigThunks.fetchConfig()); }, [dispatch]);

  const update = (patch: Partial<PakConfig>) => {
    dispatch(pakConfigActions.updateConfig(patch));
  };

  const load = () => {
    dispatch(pakConfigThunks.fetchConfig());
  };

  const save = async () => {
    if (!config) return;
    try {
      await dispatch(pakConfigThunks.saveConfig(config as unknown as Record<string, unknown>)).unwrap();
      toast({ title: "Config saved", status: "success", duration: 2000, position: "top-right" });
    } catch (e) {
      toast({ title: "Failed to save", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
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
