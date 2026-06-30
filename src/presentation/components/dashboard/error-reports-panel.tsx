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
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchReports,
  patchReport,
  deleteReport,
  deleteAllReports,
  setReportsFilter,
  setReportsSearch,
  setReportsOffset,
  selectReportsCounts,
  selectReportsItems,
  selectReportsLoading,
  selectReportsFilter,
  selectReportsSearch,
  selectReportsOffset,
  selectReportsTotal,
  selectReportsSavingId,
  selectReportsDeletingId,
  selectReportsMassDeleting,
} from "@/store/slices/anime/reports-slice";

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
  const dispatch = useAppDispatch();
  const counts = useAppSelector(selectReportsCounts);
  const items = useAppSelector(selectReportsItems);
  const loading = useAppSelector(selectReportsLoading);
  const filter = useAppSelector(selectReportsFilter);
  const search = useAppSelector(selectReportsSearch);
  const offset = useAppSelector(selectReportsOffset);
  const total = useAppSelector(selectReportsTotal);
  const saving = useAppSelector(selectReportsSavingId);
  const deleting = useAppSelector(selectReportsDeletingId);
  const massDeleting = useAppSelector(selectReportsMassDeleting);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});
  const toast = useToast();

  const doFetch = useCallback(() => {
    dispatch(fetchReports({ filter, search, offset }));
  }, [dispatch, filter, search, offset]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  // Sync notes from items when they load
  useEffect(() => {
    if (items.length > 0) {
      const noteMap: Record<number, string> = {};
      items.forEach((r) => { noteMap[r.id] = r.admin_notes || ""; });
      setNotes((prev) => ({ ...prev, ...noteMap }));
    }
  }, [items]);

  const handlePatch = async (id: number, body: Record<string, string>, msg: string) => {
    try {
      await dispatch(patchReport({ id, body })).unwrap();
      toast({ title: msg, status: "success", duration: 2000, position: "top-right" });
      if (body.status) doFetch();
    } catch {
      toast({ title: "Failed to update", status: "error", duration: 3000, position: "top-right" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteReport(id)).unwrap();
      toast({ title: "Report deleted", status: "info", duration: 2000, position: "top-right" });
      doFetch();
    } catch {
      toast({ title: "Failed to delete", status: "error", duration: 3000, position: "top-right" });
    }
  };

  const handleDeleteAll = async (status?: string) => {
    try {
      await dispatch(deleteAllReports(status)).unwrap();
      toast({ title: status ? `All "${status}" reports deleted` : "All reports deleted", status: "info", duration: 2000, position: "top-right" });
      doFetch();
    } catch {
      toast({ title: "Failed to delete", status: "error", duration: 3000, position: "top-right" });
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleFilterChange = (f: StatusFilter) => { dispatch(setReportsFilter(f)); };
  const handleSearch = (v: string) => { dispatch(setReportsSearch(v)); };
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
            <Button size="sm" variant="ghost" borderRadius="lg" leftIcon={<MdRefresh />} onClick={doFetch} color="gray.500" _hover={{ color: "brand.600" }}>
              Refresh
            </Button>
            <Button size="sm" colorScheme="red" borderRadius="lg" leftIcon={<MdDelete />} onClick={() => handleDeleteAll(filter !== "all" ? filter : undefined)} isLoading={massDeleting}>
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
      {!loading && (
        <VStack spacing={3} align="stretch">
          {items.map((r) => (
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
                        <Button size="xs" colorScheme="orange" variant="outline" borderRadius="lg" leftIcon={<MdCheckCircle />} onClick={() => handlePatch(r.id, { status: "ack" }, "Marked as ack")} isLoading={saving === r.id}>
                          Mark Ack
                        </Button>
                      )}
                      {r.status !== "closed" && (
                        <Button size="xs" colorScheme="gray" variant="outline" borderRadius="lg" leftIcon={<MdCheckCircle />} onClick={() => handlePatch(r.id, { status: "closed" }, "Marked as closed")} isLoading={saving === r.id}>
                          Close
                        </Button>
                      )}
                      <Button size="xs" colorScheme="brand" borderRadius="lg" leftIcon={<MdSave />} onClick={() => handlePatch(r.id, { admin_notes: notes[r.id] || "" }, "Notes saved")} isLoading={saving === r.id}>
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
                        onClick={() => handleDelete(r.id)}
                        isLoading={deleting === r.id}
                      />
                    </HStack>
                  </VStack>
                </Box>
              </Collapse>
            </Box>
          ))}

          {/* Empty State */}
          {items.length === 0 && (
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
            <Button size="sm" variant="outline" borderRadius="lg" onClick={() => dispatch(setReportsOffset(offset - LIMIT))} isDisabled={!hasPrev}>
              Prev
            </Button>
            <Button size="sm" variant="outline" borderRadius="lg" onClick={() => dispatch(setReportsOffset(offset + LIMIT))} isDisabled={!hasNext}>
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Flex>
  );
}
