import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { COLORS } from '../utils/constants';

export default function GridBackdrop({ density = 36, sideWidth = 52 }) {
  const height = 1200;
  const width = sideWidth;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.side, styles.left, { width: sideWidth }]}>
        <Svg width={width} height={height}>
          {Array.from({ length: Math.floor(height / density) + 1 }).map((_, index) => (
            <Line
              key={`left-h-${index}`}
              x1="0"
              y1={index * density}
              x2={width}
              y2={index * density}
              stroke={COLORS.grid}
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: Math.floor(width / density) + 1 }).map((_, index) => (
            <Line
              key={`left-v-${index}`}
              x1={index * density}
              y1="0"
              x2={index * density}
              y2={height}
              stroke={COLORS.grid}
              strokeWidth="1"
            />
          ))}
        </Svg>
      </View>
      <View style={[styles.side, styles.right, { width: sideWidth }]}>
        <Svg width={width} height={height}>
          {Array.from({ length: Math.floor(height / density) + 1 }).map((_, index) => (
            <Line
              key={`right-h-${index}`}
              x1="0"
              y1={index * density}
              x2={width}
              y2={index * density}
              stroke={COLORS.grid}
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: Math.floor(width / density) + 1 }).map((_, index) => (
            <Line
              key={`right-v-${index}`}
              x1={index * density}
              y1="0"
              x2={index * density}
              y2={height}
              stroke={COLORS.grid}
              strokeWidth="1"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    opacity: 0.65
  },
  left: {
    left: 0
  },
  right: {
    right: 0
  }
});
