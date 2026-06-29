import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

interface StatPillProps {
  label: string;
  value: string;
  color?: string;
  style?: ViewStyle;
}

export function StatPill({ label, value, color = theme.colors.textPrimary, style }: StatPillProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 92,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.xs,
    marginBottom: 6,
  },
  value: {
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
});
