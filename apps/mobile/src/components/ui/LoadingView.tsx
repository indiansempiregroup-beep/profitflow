import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface LoadingViewProps {
  label?: string;
  style?: ViewStyle;
}

export function LoadingView({ label = 'Loading…', style }: LoadingViewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
