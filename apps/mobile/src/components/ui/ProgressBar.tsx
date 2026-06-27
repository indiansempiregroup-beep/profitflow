import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ProgressBarProps {
  value: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({ value, color, backgroundColor, style }: ProgressBarProps) {
  const theme = useTheme();
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor ?? theme.colors.surfaceElevated }, style]}>
      <View
        style={[
          styles.filled,
          {
            width: `${safeValue}%`,
            backgroundColor: color ?? theme.colors.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  filled: {
    height: '100%',
  },
});
