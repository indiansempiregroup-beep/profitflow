import React, { type ReactNode } from 'react';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 18, fontSize: 16 },
  lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 18 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const selectedSize = sizeStyles[size];

  const variantStyle = (() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
          borderWidth: 1,
          textColor: theme.colors.textPrimary,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.danger,
          borderColor: theme.colors.danger,
          borderWidth: 0,
          textColor: theme.colors.primaryForeground,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          textColor: theme.colors.primary,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 0,
          textColor: theme.colors.primaryForeground,
        };
    }
  })();

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.button,
    {
      backgroundColor: variantStyle.backgroundColor,
      borderColor: variantStyle.borderColor,
      borderWidth: variantStyle.borderWidth,
      borderRadius: theme.radius.md,
      opacity: disabled ? 0.55 : 1,
      paddingVertical: selectedSize.paddingVertical,
      paddingHorizontal: selectedSize.paddingHorizontal,
    },
    style,
  ];

  const textStyle: StyleProp<TextStyle> = [
    styles.label,
    {
      color: variantStyle.textColor,
      fontSize: selectedSize.fontSize,
      fontFamily: theme.typography.fontFamily,
    },
  ];

  return (
    <Pressable
      style={({ pressed }) => [buttonStyle, pressed && styles.pressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {icon ? <>{icon}</> : null}
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontWeight: '600',
  },
});
