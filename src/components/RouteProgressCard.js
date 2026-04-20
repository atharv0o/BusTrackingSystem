import React from 'react';
import { Badge, Box, HStack, Text, VStack } from 'native-base';
import { COLORS } from '../utils/constants';

export default function RouteProgressCard({
  currentStop,
  nextStop,
  completedCount = 0,
  totalCount = 0
}) {
  return (
    <Box p={4} rounded="3xl" borderWidth={1} borderColor={COLORS.border} bg="white">
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="800">
            Route Progress
          </Text>
          <Badge colorScheme="primary" rounded="full">
            {completedCount}/{totalCount}
          </Badge>
        </HStack>

        <VStack space={2}>
          <Text color={COLORS.mutedText}>
            Current Stop: {currentStop?.name || 'None'}
          </Text>
          <Text color={COLORS.mutedText}>
            Next Stop: {nextStop?.name || 'None'}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
