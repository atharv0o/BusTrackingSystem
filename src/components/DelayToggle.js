import React from 'react';
import { Checkbox, FormControl, Input, TextArea, VStack } from 'native-base';
import { COLORS } from '../utils/constants';

export default function DelayToggle({
  isDelayed,
  reason,
  onChangeDelayed,
  onChangeReason,
  label = 'Is there a delay?'
}) {
  return (
    <VStack space={3}>
      <Checkbox
        isChecked={Boolean(isDelayed)}
        onChange={onChangeDelayed}
        colorScheme="primary"
        accessibilityLabel={label}
      >
        {label}
      </Checkbox>

      {isDelayed ? (
        <FormControl>
          <FormControl.Label>Delay reason</FormControl.Label>
          <TextArea
            value={reason}
            onChangeText={onChangeReason}
            placeholder="Optional reason for the delay"
            autoCompleteType="off"
            borderRadius="xl"
            bg={COLORS.surface}
            minH={24}
          />
        </FormControl>
      ) : null}
    </VStack>
  );
}
