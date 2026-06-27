import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface BadgeProps {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
  style?: ViewStyle;
}

const variantStyles = (theme: ReturnType<typeof useTheme>, variant: NonNullable<BadgeProps['variant']>) => {
  switch (variant) {
    case 'success':
      return { backgroundColor: theme.colors.success, color: theme.colors.primaryForeground };
    case 'warning':
      return { backgroundColor: theme.colors.warning, color: theme.colors.secondaryForeground };
    case 'danger':
      return { backgroundColor: theme.colors.danger, color: theme.colors.primaryForeground };
    case 'secondary':
      return { backgroundColor: theme.colors.surfaceElevated, color: theme.colors.textPrimary };
    default:
      return { backgroundColor: theme.colors.accent, color: theme.colors.primaryForeground };
  }
};

export function Badge({ label, icon, variant = 'default', style }: BadgeProps) {
  const theme = useTheme();
  const colors = variantStyles(theme, variant);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColor }, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, { color: colors.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
