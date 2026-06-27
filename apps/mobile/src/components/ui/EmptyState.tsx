import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ title, description, icon, actionLabel, onAction, style }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '22' }]}>{icon}</View> : null}
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.actionWrapper}>
          <Text onPress={onAction} style={[styles.action, { color: theme.colors.primary }]}>
            {actionLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrapper: {
    marginBottom: 18,
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionWrapper: {
    marginTop: 18,
  },
  action: {
    fontSize: 15,
    fontWeight: '600',
  },
});
