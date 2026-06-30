"use client";

import { useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Spinner,
  SimpleGrid,
  Button,
  HStack,
  Select,
  useToast,
  Icon,
} from "@chakra-ui/react";
import {
  MdStar,
  MdStarBorder,
  MdStarHalf,
  MdRateReview,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdSmartphone,
  MdAndroid,
} from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchFeedback,
  setFeedbackOffset,
  setFeedbackRatingFilter,
  selectFeedbackItems,
  selectFeedbackLoading,
  selectFeedbackAvgRating,
  selectFeedbackDistribution,
  selectFeedbackTotal,
  selectFeedbackOffset,
  selectFeedbackRatingFilter,
} from "@/store/slices/anime/feedback-slice";
import { StatCard } from "./stat-card";

const LIMIT = 20;

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<Icon key={i} as={MdStar} color="yellow.400" boxSize={4} />);
    } else if (i - 0.5 <= rating) {
      stars.push(<Icon key={i} as={MdStarHalf} color="yellow.400" boxSize={4} />);
    } else {
      stars.push(<Icon key={i} as={MdStarBorder} color="gray.300" boxSize={4} />);
    }
  }
  return <HStack spacing={0}>{stars}</HStack>;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const RATING_COLORS: Record<number, { bg: string; color: string }> = {
  5: { bg: "green.50", color: "green.700" },
  4: { bg: "green.50", color: "green.600" },
  3: { bg: "yellow.50", color: "yellow.700" },
  2: { bg: "orange.50", color: "orange.700" },
  1: { bg: "red.50", color: "red.700" },
};

export function RatingFeedbackPanel() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectFeedbackItems);
  const loading = useAppSelector(selectFeedbackLoading);
  const avgRating = useAppSelector(selectFeedbackAvgRating);
  const ratingDist = useAppSelector(selectFeedbackDistribution);
  const total = useAppSelector(selectFeedbackTotal);
  const offset = useAppSelector(selectFeedbackOffset);
  const ratingFilter = useAppSelector(selectFeedbackRatingFilter);
  const toast = useToast();

  useEffect(() => {
    dispatch(fetchFeedback({ offset, ratingFilter }));
  }, [dispatch, offset, ratingFilter]);

  const handleRatingFilter = (val: string) => {
    dispatch(setFeedbackRatingFilter(val));
  };

  const handleRefresh = () => {
    dispatch(fetchFeedback({ offset, ratingFilter }));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalFeedback = ratingDist.reduce((sum, r) => sum + Number(r.count), 0);

  return (
    <Flex direction="column" gap={4}>
      {/* Stats */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
        <StatCard
          title="Total Feedback"
          value={String(totalFeedback)}
          icon={MdRateReview}
          gradient="linear(135deg, #a855f7, #7c3aed)"
          change="All submissions"
          changeType="neutral"
        />
        <StatCard
          title="Average Rating"
          value={String(avgRating)}
          icon={MdStar}
          gradient="linear(135deg, #f59e0b, #d97706)"
          change="Out of 5 stars"
          changeType={
            avgRating >= 4
              ? "positive"
              : avgRating >= 3
                ? "neutral"
                : "negative"
          }
        />
        <StatCard
          title="5-Star Reviews"
          value={String(
            Number(ratingDist.find((r) => Number(r.rating) === 5)?.count) || 0
          )}
          icon={MdStar}
          gradient="linear(135deg, #22c55e, #16a34a)"
          change={
            totalFeedback > 0
              ? `${Math.round(((Number(ratingDist.find((r) => Number(r.rating) === 5)?.count) || 0) / totalFeedback) * 100)}% of total`
              : "No data"
          }
          changeType="positive"
        />
        <StatCard
          title="1-Star Reviews"
          value={String(
            Number(ratingDist.find((r) => Number(r.rating) === 1)?.count) || 0
          )}
          icon={MdStar}
          gradient="linear(135deg, #ef4444, #dc2626)"
          change={
            totalFeedback > 0
              ? `${Math.round(((Number(ratingDist.find((r) => Number(r.rating) === 1)?.count) || 0) / totalFeedback) * 100)}% of total`
              : "No data"
          }
          changeType="negative"
        />
      </SimpleGrid>

      {/* Rating Distribution */}
      <Box
        bg="white"
        border="1px"
        borderColor="gray.100"
        borderRadius="2xl"
        p={5}
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      >
        <Text fontSize="md" fontWeight="700" color="gray.800" mb={3}>
          Rating Distribution
        </Text>
        <Flex direction="column" gap={2}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              Number(ratingDist.find((r) => Number(r.rating) === star)?.count) || 0;
            const pct = totalFeedback > 0 ? (count / totalFeedback) * 100 : 0;
            return (
              <Flex key={star} align="center" gap={3}>
                <HStack spacing={0} minW="80px">
                  <Text fontSize="sm" fontWeight="600" color="gray.700" mr={1}>
                    {star}
                  </Text>
                  <Icon as={MdStar} color="yellow.400" boxSize={4} />
                </HStack>
                <Box flex={1} h="8px" bg="gray.100" borderRadius="full">
                  <Box
                    h="100%"
                    w={`${pct}%`}
                    bg={
                      star >= 4
                        ? "green.400"
                        : star === 3
                          ? "yellow.400"
                          : "red.400"
                    }
                    borderRadius="full"
                    transition="width 0.3s"
                  />
                </Box>
                <Text fontSize="sm" color="gray.500" minW="50px" textAlign="right">
                  {count}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* Filter + Refresh */}
      <Box
        bg="white"
        border="1px"
        borderColor="gray.100"
        borderRadius="2xl"
        p={5}
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      >
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
          <Flex align="center" gap={2}>
            <Text fontSize="md" fontWeight="700" color="gray.800">
              Feedback Entries
            </Text>
            <Badge bg="brand.50" color="brand.700" borderRadius="lg" px={2}>
              {total}
            </Badge>
          </Flex>
          <HStack spacing={2}>
            <Select
              size="sm"
              borderRadius="lg"
              bg="gray.50"
              value={ratingFilter}
              onChange={(e) => handleRatingFilter(e.target.value)}
              w="140px"
              _focus={{ bg: "white", borderColor: "brand.500" }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="lg"
              leftIcon={<MdRefresh />}
              onClick={handleRefresh}
              isLoading={loading}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner color="brand.500" />
          </Flex>
        ) : items && items.length > 0 ? (
          <Flex direction="column" gap={3}>
            {items.map((entry) => {
              const ratingColor = RATING_COLORS[entry.rating] || {
                bg: "gray.50",
                color: "gray.600",
              };
              return (
                <Box
                  key={entry.id}
                  p={4}
                  borderRadius="xl"
                  bg="gray.50"
                  _hover={{ bg: "gray.100" }}
                  transition="all 0.15s"
                >
                  <Flex
                    justify="space-between"
                    align="flex-start"
                    mb={2}
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Flex align="center" gap={3}>
                      <Badge
                        bg={ratingColor.bg}
                        color={ratingColor.color}
                        borderRadius="lg"
                        px={2}
                        py={1}
                        fontSize="sm"
                        fontWeight="700"
                      >
                        {entry.rating}/5
                      </Badge>
                      <StarRating rating={entry.rating} />
                    </Flex>
                    <Text fontSize="xs" color="gray.400">
                      {formatDate(entry.created_at)}
                    </Text>
                  </Flex>

                  {/* Problem Types */}
                  {entry.problem_types && (
                    <Flex gap={1} mb={2} flexWrap="wrap">
                      {entry.problem_types.split(",").map((tag, i) => (
                        <Badge
                          key={i}
                          bg="brand.50"
                          color="brand.700"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="500"
                        >
                          {tag.trim()}
                        </Badge>
                      ))}
                    </Flex>
                  )}

                  {/* Description */}
                  {entry.description && (
                    <Text
                      fontSize="sm"
                      color="gray.700"
                      mb={2}
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                    >
                      {entry.description}
                    </Text>
                  )}

                  {/* Device info */}
                  <HStack spacing={3} flexWrap="wrap">
                    {entry.device_model && (
                      <Flex align="center" gap={1}>
                        <Icon as={MdSmartphone} color="gray.400" boxSize={3.5} />
                        <Text fontSize="xs" color="gray.500">
                          {entry.device_model}
                        </Text>
                      </Flex>
                    )}
                    {entry.app_version && (
                      <Flex align="center" gap={1}>
                        <Text fontSize="xs" color="gray.400" fontWeight="600">
                          v
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {entry.app_version}
                        </Text>
                      </Flex>
                    )}
                    {entry.android_version && (
                      <Flex align="center" gap={1}>
                        <Icon as={MdAndroid} color="gray.400" boxSize={3.5} />
                        <Text fontSize="xs" color="gray.500">
                          Android {entry.android_version}
                        </Text>
                      </Flex>
                    )}
                  </HStack>
                </Box>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center" align="center" gap={3} pt={2}>
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius="lg"
                  leftIcon={<MdChevronLeft />}
                  onClick={() => dispatch(setFeedbackOffset(Math.max(0, offset - LIMIT)))}
                  isDisabled={offset === 0}
                >
                  Previous
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Page {currentPage} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius="lg"
                  rightIcon={<MdChevronRight />}
                  onClick={() => dispatch(setFeedbackOffset(offset + LIMIT))}
                  isDisabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </Flex>
            )}
          </Flex>
        ) : (
          <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>
            No feedback entries found
          </Text>
        )}
      </Box>
    </Flex>
  );
}
