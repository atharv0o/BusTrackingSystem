import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Box, Button, Divider, Text, VStack, useToast } from 'native-base';
import * as Clipboard from 'expo-clipboard';
import { useSelector } from 'react-redux';
import CustomHeader from '../../components/CustomHeader';
import GridBackdrop from '../../components/GridBackdrop';
import { COLORS } from '../../utils/constants';

export default function ShareCodeScreen() {
  const toast = useToast();
  const currentTrip = useSelector((state) => state.driver.currentTrip);

  const copyCode = async () => {
    if (!currentTrip?.trackingCode) return;
    await Clipboard.setStringAsync(currentTrip.trackingCode);
    toast.show({ description: 'Tracking code copied to clipboard.' });
  };

  return (
    <View style={styles.container}>
      <GridBackdrop />
      <CustomHeader title="Share Code" subtitle="Give this code to students so they can track the active trip." />

      <VStack flex={1} px={4} space={4} pb={4} justifyContent="center">
        <Box p={5} rounded="3xl" bg="white" borderWidth={1} borderColor={COLORS.border} alignItems="center">
          <Text fontSize="sm" color={COLORS.mutedText}>
            Tracking code
          </Text>
          <Text fontSize="5xl" fontWeight="900" letterSpacing={4} color={COLORS.text} mt={2}>
            {currentTrip?.trackingCode || '------'}
          </Text>
          <Divider my={4} />
          <Badge colorScheme="primary" rounded="full">
            Share this code with students
          </Badge>
        </Box>

        <Button onPress={copyCode} isDisabled={!currentTrip?.trackingCode}>
          Copy to Clipboard
        </Button>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
});
