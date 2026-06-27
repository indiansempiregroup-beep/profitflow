import React, { type ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.shadow.card.shadowColor,
    shadowOffset: theme.shadow.card.shadowOffset,
    shadowOpacity: theme.shadow.card.shadowOpacity,
    shadowRadius: theme.shadow.card.shadowRadius,
    elevation: theme.shadow.card.elevation,
  },
});
