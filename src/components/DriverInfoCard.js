import React from 'react';
import { Badge, Box, HStack, Text, VStack } from 'native-base';
import { COLORS } from '../utils/constants';

export default function DriverInfoCard({
  driverName,
  busNumber,
  routeNumber,
  currentStop,
  nextStop,
  etaText,
  subtitle = null
}) {
  return (
    <Box p={4} rounded="3xl" borderWidth={1} borderColor={COLORS.border} bg="white">
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="800">
            Bus Info
          </Text>
          <Badge colorScheme="primary" rounded="full">
            Live
          </Badge>
        </HStack>

        {subtitle ? (
          <Text color={COLORS.mutedText} fontSize="sm">
            {subtitle}
          </Text>
        ) : null}

        <VStack space={2}>
          <Text>Driver: {driverName || 'Not available'}</Text>
          <Text>Bus Number: {busNumber || 'Not available'}</Text>
          <Text>Route: {routeNumber || 'Not available'}</Text>
          <Text>Current Stop: {currentStop || 'Not available'}</Text>
          <Text>Next Stop: {nextStop || 'Not available'}</Text>
          <Text>ETA: {etaText || 'Not available'}</Text>
        </VStack>
      </VStack>
    </Box>
  );
}
