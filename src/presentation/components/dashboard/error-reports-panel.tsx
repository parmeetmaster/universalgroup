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
  Spinner,
  useToast,
  InputGroup,
  InputLeftElement,
  Collapse,
} from "@chakra-ui/react";
import {
  MdBugReport,
  MdSearch,
  MdDelete,
  MdCheckCircle,
  MdExpandMore,
  MdExpandLess,
  MdSave,
  MdRefresh,
} from "react-icons/md";

interface Report {
  id: number; device_name: string; app_version: string;
  error_title: string; error_message: string; download_url: string;
  additional_info: string; status: "open" | "ack" | "closed";
  admin_notes: string; created_at: string; updated_at: string;
  location: string | null;
}

interface ReportsResponse {
  total: number;
  counts: { total: number; open: number; ack: number; closed: number };
  items: Report[];
}

type StatusFilter = "all" | "open" | "ack" | "closed";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open: { bg: "green.50", color: "green.700" },
  ack: { bg: "orange.50", color: "orange.700" },
  closed: { bg: "gray.100", color: "gray.600" },
};

const LIMIT = 20;

function DetailBlock({ label, children, scrollable }: { label: string; children: React.ReactNode; scrollable?: boolean }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{label}</Text>
      <Box p={3} bg="gray.50" borderRadius="lg" fontSize="xs" color="gray.700" whiteSpace="pre-wrap" wordBreak="break-all" {...(scrollable ? { maxH: "120px", overflowY: "auto" as const } : {})}>
        {children}
      </Box>
    </Box>
  );
}

export function ErrorReportsPanel() {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [massDeleting, setMassDeleting] = useState(false);
  const toast = useToast();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/db/anime/reports?${params}`);
      const json: ReportsResponse = await res.json();
      setData(json);
      const noteMap: Record<number, string> = {};
      json.items.forEach((r) => { noteMap[r.id] = r.admin_notes || ""; });
      setNotes((prev) => ({ ...prev, ...noteMap }));
    } catch {
      toast({ title: "Failed to load reports", status: "error", duration: 3000, position: "top-right" });
    }
    setLoading(false);
  }, [filter, search, offset, toast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchReports(); }, [fetchReports]);

  const patchReport = async (id: number, body: Record<string, string>, msg: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/db/anime/reports/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!(await res.json()).success) throw new Error();
      toast({ title: msg, status: "success", duration: 2000, position: "top-right" });
      if (body.status) await fetchReports();
    } catch {
      toast({ title: "Failed to update", status: "error", duration: 3000, position: "top-right" });
    }
    setSaving(null);
  };

  const deleteReport = async (id: number) => {
    setDeleting(id);
    try {
      if (!(await (await fetch(`/api/db/anime/reports/${id}`, { method: "DELETE" })).json()).success) throw new Error();
      toast({ title: "Report deleted", status: "info", duration: 2000, position: "top-right" });
      await fetchReports();
    } catch {
      toast({ title: "Failed to delete", status: "error", duration: 3000, position: "top-right" });
    }
    setDeleting(null);
  };

  const deleteAll = async (status?: string) => {
    setMassDeleting(true);
    try {
      const url = status ? `/api/db/anime/reports?status=${status}` : "/api/db/anime/reports";
      const res = await fetch(url, { method: "DELETE" });
      if (!(await res.json()).success) throw new Error();
      toast({ title: status ? `All "${status}" reports deleted` : "All reports deleted", status: "info", duration: 2000, position: "top-right" });
      setOffset(0);
      await fetchReports();
    } catch {
      toast({ title: "Failed to delete", status: "error", duration: 3000, position: "top-right" });
    }
    setMassDeleting(false);
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleFilterChange = (f: StatusFilter) => { setFilter(f); setOffset(0); };
  const handleSearch = (v: string) => { setSearch(v); setOffset(0); };
  const counts = data?.counts || { total: 0, open: 0, ack: 0, closed: 0 };
  const total = data?.total ?? 0;
  const hasNext = offset + LIMIT < total;
  const hasPrev = offset > 0;

  return (
    <Flex direction="column" gap={4}>
      {/* Header */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Flex align="center" gap={2}>
            <Box as={MdBugReport} boxSize={5} color="brand.500" />
            <Text fontSize="lg" fontWeight="700" color="gray.800">Error Reports</Text>
          </Flex>
          <HStack spacing={2} flexWrap="wrap">
            <Badge bg="gray.100" color="gray.600" borderRadius="lg" px={2}>{counts.total} Total</Badge>
            <Badge bg="green.50" color="green.700" borderRadius="lg" px={2}>{counts.open} Open</Badge>
            <Badge bg="orange.50" color="orange.700" borderRadius="lg" px={2}>{counts.ack} Ack</Badge>
            <Badge bg="gray.100" color="gray.500" borderRadius="lg" px={2}>{counts.closed} Closed</Badge>
            <Button size="sm" variant="ghost" borderRadius="lg" leftIcon={<MdRefresh />} onClick={fetchReports} color="gray.500" _hover={{ color: "brand.600" }}>
              Refresh
            </Button>
            <Button size="sm" colorScheme="red" borderRadius="lg" leftIcon={<MdDelete />} onClick={() => deleteAll(filter !== "all" ? filter : undefined)} isLoading={massDeleting}>
              {filter !== "all" ? `Delete All ${filter}` : "Delete All"}
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Filters */}
      <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={4} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
        <Flex gap={3} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
          <HStack spacing={1}>
            {(["all", "open", "ack", "closed"] as StatusFilter[]).map((s) => (
              <Button key={s} size="sm" borderRadius="lg" variant={filter === s ? "solid" : "ghost"}
                colorScheme={filter === s ? "brand" : "gray"} onClick={() => handleFilterChange(s)} textTransform="capitalize">{s}</Button>
            ))}
          </HStack>
          <InputGroup size="sm" maxW={{ md: "280px" }}>
            <InputLeftElement pointerEvents="none"><MdSearch color="gray" /></InputLeftElement>
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              borderRadius="lg"
              bg="gray.50"
              _focus={{ bg: "white", borderColor: "brand.500" }}
            />
          </InputGroup>
        </Flex>
      </Box>

      {/* Loading */}
      {loading && <Flex justify="center" py={10}><Spinner color="brand.500" /></Flex>}

      {/* Reports List */}
      {!loading && data && (
        <VStack spacing={3} align="stretch">
          {data.items.map((r) => (
            <Box key={r.id} bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={5} boxShadow="0 1px 3px rgba(0,0,0,0.04)" transition="all 0.15s">
              {/* Report header - clickable */}
              <Flex justify="space-between" align="flex-start" cursor="pointer" onClick={() => toggleExpand(r.id)}>
                <Box flex={1} mr={3}>
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontSize="sm" fontWeight="700" color="gray.800" noOfLines={1}>{r.error_title}</Text>
                    <Badge bg={STATUS_COLORS[r.status].bg} color={STATUS_COLORS[r.status].color} borderRadius="lg" px={2} fontSize="xs" textTransform="capitalize" flexShrink={0}>
                      {r.status}
                    </Badge>
                  </Flex>
                  <HStack spacing={3} flexWrap="wrap">
                    <Text fontSize="xs" color="gray.500">{r.device_name}</Text>
                    <Text fontSize="xs" color="gray.400">v{r.app_version}</Text>
                    <Text fontSize="xs" color="gray.400">{new Date(r.created_at).toLocaleDateString()}</Text>
                    {r.location && (
                      <Text fontSize="xs" color="brand.500">📍 {r.location}</Text>
                    )}
                  </HStack>
                </Box>
                <IconButton aria-label="Toggle details" icon={expanded.has(r.id) ? <MdExpandLess /> : <MdExpandMore />}
                  size="sm" variant="ghost" color="gray.400" borderRadius="lg" onClick={(e) => { e.stopPropagation(); toggleExpand(r.id); }} />
              </Flex>

              {/* Expandable details */}
              <Collapse in={expanded.has(r.id)} animateOpacity>
                <Box mt={4} pt={4} borderTop="1px" borderColor="gray.100">
                  <VStack spacing={3} align="stretch">
                    {r.error_message && <DetailBlock label="Error Message" scrollable>{r.error_message}</DetailBlock>}
                    {r.download_url && (
                      <Box>
                        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>Download URL</Text>
                        <Text fontSize="xs" color="brand.600" wordBreak="break-all">{r.download_url}</Text>
                      </Box>
                    )}
                    {r.additional_info && <DetailBlock label="Additional Info" scrollable>{r.additional_info}</DetailBlock>}

                    <Box>
                      <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>Admin Notes</Text>
                      <Textarea value={notes[r.id] ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                        size="sm" borderRadius="lg" bg="gray.50" rows={2} fontSize="xs" placeholder="Add notes..." _focus={{ bg: "white", borderColor: "brand.500" }} />
                    </Box>

                    {/* Actions */}
                    <HStack spacing={2} justify="flex-end" flexWrap="wrap">
                      {r.status !== "ack" && (
                        <Button size="xs" colorScheme="orange" variant="outline" borderRadius="lg" leftIcon={<MdCheckCircle />} onClick={() => patchReport(r.id, { status: "ack" }, "Marked as ack")} isLoading={saving === r.id}>
                          Mark Ack
                        </Button>
                      )}
                      {r.status !== "closed" && (
                        <Button size="xs" colorScheme="gray" variant="outline" borderRadius="lg" leftIcon={<MdCheckCircle />} onClick={() => patchReport(r.id, { status: "closed" }, "Marked as closed")} isLoading={saving === r.id}>
                          Close
                        </Button>
                      )}
                      <Button size="xs" colorScheme="brand" borderRadius="lg" leftIcon={<MdSave />} onClick={() => patchReport(r.id, { admin_notes: notes[r.id] || "" }, "Notes saved")} isLoading={saving === r.id}>
                        Save Notes
                      </Button>
                      <IconButton
                        aria-label="Delete"
                        icon={<MdDelete />}
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: "red.500", bg: "red.50" }}
                        borderRadius="lg"
                        onClick={() => deleteReport(r.id)}
                        isLoading={deleting === r.id}
                      />
                    </HStack>
                  </VStack>
                </Box>
              </Collapse>
            </Box>
          ))}

          {/* Empty State */}
          {data.items.length === 0 && (
            <Box bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={8} textAlign="center">
              <Box as={MdBugReport} boxSize={8} color="gray.300" mx="auto" mb={2} />
              <Text color="gray.400" fontSize="sm">No error reports found.</Text>
            </Box>
          )}
        </VStack>
      )}

      {/* Pagination */}
      {!loading && total > LIMIT && (
        <Flex justify="space-between" align="center" bg="white" border="1px" borderColor="gray.100" borderRadius="2xl" p={4} boxShadow="0 1px 3px rgba(0,0,0,0.04)">
          <Text fontSize="xs" color="gray.500">
            Showing {offset + 1}-{Math.min(offset + LIMIT, total)} of {total}
          </Text>
          <HStack spacing={2}>
            <Button size="sm" variant="outline" borderRadius="lg" onClick={() => setOffset(offset - LIMIT)} isDisabled={!hasPrev}>
              Prev
            </Button>
            <Button size="sm" variant="outline" borderRadius="lg" onClick={() => setOffset(offset + LIMIT)} isDisabled={!hasNext}>
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Flex>
  );
}
