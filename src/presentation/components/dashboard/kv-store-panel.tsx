"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Textarea,
  Button,
  IconButton,
  VStack,
  HStack,
  Badge,
  Code,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/react";
import { MdSave, MdDelete, MdAdd, MdEdit, MdCancel, MdRefresh } from "react-icons/md";

interface KvEntry {
  key: string;
  value: string;
  updatedAt: string;
}

export function KvStorePanel() {
  const [entries, setEntries] = useState<KvEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New entry form
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addErrors, setAddErrors] = useState<{ key?: string; value?: string }>({});

  const toast = useToast();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/anime/kv");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      toast({ title: "Failed to load KV entries", status: "error", duration: 3000, position: "top-right" });
    }
    setLoading(false);
  }, [toast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEntries(); }, [loadEntries]);

  const validateAdd = (): boolean => {
    const errors: { key?: string; value?: string } = {};
    if (!newKey.trim()) errors.key = "Key is required";
    else if (newKey.length > 128) errors.key = "Max 128 characters";
    else if (entries.find((e) => e.key === newKey.trim())) errors.key = "Key already exists";
    if (!newValue.trim()) errors.value = "Value is required";
    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateAdd()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), value: newValue }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: `Added "${newKey.trim()}"`, status: "success", duration: 2000, position: "top-right" });
      setNewKey("");
      setNewValue("");
      setShowAddForm(false);
      setAddErrors({});
      await loadEntries();
    } catch (e) {
      toast({ title: "Failed to add", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setSaving(false);
  };

  const handleUpdate = async (key: string) => {
    if (!editValue.trim()) {
      toast({ title: "Value cannot be empty", status: "warning", duration: 2000, position: "top-right" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editValue }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: `Updated "${key}"`, status: "success", duration: 2000, position: "top-right" });
      setEditingKey(null);
      await loadEntries();
    } catch (e) {
      toast({ title: "Failed to update", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setSaving(false);
  };

  const handleDelete = async (key: string) => {
    setDeleting(key);
    try {
      const res = await fetch("/api/db/anime/kv", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: `Deleted "${key}"`, status: "info", duration: 2000, position: "top-right" });
      await loadEntries();
    } catch (e) {
      toast({ title: "Failed to delete", description: String(e), status: "error", duration: 3000, position: "top-right" });
    }
    setDeleting(null);
  };

  const startEdit = (entry: KvEntry) => {
    setEditingKey(entry.key);
    setEditValue(entry.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const formatValue = (val: string): string => {
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  if (loading) return <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>;

  return (
    <Flex direction="column" gap={4}>
      {/* Header */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex justify="space-between" align="center" mb={1}>
          <Flex align="center" gap={2}>
            <Text fontSize="lg" fontWeight="700" color="gray.800">KV Store</Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>{entries.length} entries</Badge>
          </Flex>
          <HStack spacing={2}>
            <Button size="sm" variant="ghost" borderRadius="lg" leftIcon={<MdRefresh />} onClick={loadEntries} color="gray.500" _hover={{ color: "brand.600" }}>
              Refresh
            </Button>
            <Button size="sm" colorScheme="brand" borderRadius="lg" leftIcon={<MdAdd />} onClick={() => { setShowAddForm(!showAddForm); setAddErrors({}); }}>
              Add Entry
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Add Form */}
      {showAddForm && (
        <Box bg="white" border="2px" borderColor="brand.200" borderRadius="2xl" p={5} boxShadow="0 4px 12px rgba(124, 58, 237, 0.08)">
          <Text fontSize="md" fontWeight="700" color="gray.800" mb={4}>New Entry</Text>
          <Flex direction={{ base: "column", md: "row" }} gap={4}>
            <FormControl isInvalid={!!addErrors.key} flex="1">
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Key</FormLabel>
              <Input
                placeholder="e.g. app_version"
                value={newKey}
                onChange={(e) => { setNewKey(e.target.value); setAddErrors((p) => ({ ...p, key: undefined })); }}
                size="sm"
                borderRadius="lg"
                bg="gray.50"
                _focus={{ bg: "white", borderColor: "brand.500" }}
              />
              <FormErrorMessage fontSize="xs">{addErrors.key}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!addErrors.value} flex="2">
              <FormLabel fontSize="sm" fontWeight="600" color="gray.600">Value</FormLabel>
              <Textarea
                placeholder='e.g. "2.0.1" or {"key": "value"} (stored as JSON)'
                value={newValue}
                onChange={(e) => { setNewValue(e.target.value); setAddErrors((p) => ({ ...p, value: undefined })); }}
                size="sm"
                borderRadius="lg"
                bg="gray.50"
                rows={2}
                _focus={{ bg: "white", borderColor: "brand.500" }}
              />
              <FormErrorMessage fontSize="xs">{addErrors.value}</FormErrorMessage>
            </FormControl>
          </Flex>

          <HStack mt={4} spacing={2} justify="flex-end">
            <Button size="sm" variant="ghost" borderRadius="lg" onClick={() => { setShowAddForm(false); setNewKey(""); setNewValue(""); setAddErrors({}); }} leftIcon={<MdCancel />}>
              Cancel
            </Button>
            <Button size="sm" colorScheme="brand" borderRadius="lg" onClick={handleAdd} isLoading={saving} leftIcon={<MdSave />}>
              Save Entry
            </Button>
          </HStack>
        </Box>
      )}

      {/* Entries List */}
      <VStack spacing={3} align="stretch">
        {entries.map((entry) => (
          <Box key={entry.key} bg="white" border="1px" borderColor={editingKey === entry.key ? "brand.300" : "gray.100"} borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)" transition="all 0.15s">
            <Flex justify="space-between" align="center" mb={2}>
              <Flex align="center" gap={2}>
                <Code fontSize="sm" bg="brand.50" color="brand.700" borderRadius="md" px={2.5} py={0.5} fontWeight="600">{entry.key}</Code>
                {entry.updatedAt && (
                  <Text fontSize="xs" color="gray.400">
                    {new Date(entry.updatedAt).toLocaleString()}
                  </Text>
                )}
              </Flex>
              <HStack spacing={1}>
                {editingKey === entry.key ? (
                  <>
                    <Button size="xs" colorScheme="brand" borderRadius="lg" onClick={() => handleUpdate(entry.key)} isLoading={saving} leftIcon={<MdSave />}>Save</Button>
                    <Button size="xs" variant="ghost" borderRadius="lg" onClick={cancelEdit} leftIcon={<MdCancel />}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <IconButton aria-label="Edit" icon={<MdEdit />} size="xs" variant="ghost" color="gray.400" _hover={{ color: "brand.600", bg: "brand.50" }} borderRadius="lg" onClick={() => startEdit(entry)} />
                    <IconButton aria-label="Delete" icon={<MdDelete />} size="xs" variant="ghost" color="gray.400" _hover={{ color: "red.500", bg: "red.50" }} borderRadius="lg" onClick={() => handleDelete(entry.key)} isLoading={deleting === entry.key} />
                  </>
                )}
              </HStack>
            </Flex>

            {editingKey === entry.key ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                size="sm"
                borderRadius="lg"
                bg="gray.50"
                rows={4}
                fontFamily="mono"
                fontSize="xs"
                _focus={{ bg: "white", borderColor: "brand.500" }}
              />
            ) : (
              <Code display="block" p={3} borderRadius="lg" fontSize="xs" whiteSpace="pre-wrap" bg="gray.50" maxH="150px" overflowY="auto" wordBreak="break-all">
                {formatValue(entry.value)}
              </Code>
            )}
          </Box>
        ))}

        {entries.length === 0 && (
          <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={8} textAlign="center">
            <Text color="gray.400" fontSize="sm">No KV entries yet. Click &quot;Add Entry&quot; to create one.</Text>
          </Box>
        )}
      </VStack>
    </Flex>
  );
}
