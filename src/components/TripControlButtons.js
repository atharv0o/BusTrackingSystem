import React from 'react';
import { Button, HStack } from 'native-base';

export default function TripControlButtons({
  onStart,
  onPause,
  onEnd,
  startDisabled = false,
  pauseDisabled = false,
  endDisabled = false,
  loading = false
}) {
  return (
    <HStack space={3} w="full">
      <Button
        flex={1}
        colorScheme="green"
        onPress={onStart}
        isDisabled={startDisabled || loading}
      >
        START TRIP
      </Button>
      <Button
        flex={1}
        colorScheme="yellow"
        onPress={onPause}
        isDisabled={pauseDisabled || loading}
      >
        PAUSE TRIP
      </Button>
      <Button
        flex={1}
        colorScheme="red"
        onPress={onEnd}
        isDisabled={endDisabled || loading}
      >
        END TRIP
      </Button>
    </HStack>
  );
}
