import React from 'react';
import { HStack, IconButton, Text, VStack } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import GridBackdrop from './GridBackdrop';
import { COLORS } from '../utils/constants';

export default function CustomHeader({
  title,
  subtitle,
  actionIcon = null,
  onPressAction = null
}) {
  return (
    <View style={styles.wrapper}>
      <GridBackdrop density={42} sideWidth={40} />
      <VStack space={2} style={styles.content}>
        <HStack alignItems="center" justifyContent="space-between">
          <VStack flex={1} space={1}>
            <Text fontSize="2xl" fontWeight="800" color={COLORS.text}>
              {title}
            </Text>
            {subtitle ? (
              <Text fontSize="sm" color={COLORS.mutedText} maxW="92%">
                {subtitle}
              </Text>
            ) : null}
          </VStack>
          {actionIcon ? (
            <IconButton
              rounded="full"
              variant="ghost"
              icon={<MaterialCommunityIcons name={actionIcon} size={22} color={COLORS.accent} />}
              onPress={onPressAction}
              accessibilityLabel={`${title} action`}
            />
          ) : null}
        </HStack>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 108,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    overflow: 'hidden'
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12
  }
});
