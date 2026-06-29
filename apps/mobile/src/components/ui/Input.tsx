import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type TextInputProps,
} from 'react-native';
import { useTheme } from './ThemeProvider';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({ label, helperText, errorText, style, inputStyle, ...props }: InputProps) {
  const theme = useTheme();
  const supportText = errorText ?? helperText;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: errorText ? theme.colors.danger : theme.colors.border,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.size.base,
          },
          inputStyle,
        ]}
        placeholderTextColor={theme.colors.muted}
        {...props}
      />
      {supportText ? (
        <Text
          style={[
            styles.helper,
            {
              color: errorText ? theme.colors.danger : theme.colors.textSecondary,
              fontFamily: theme.typography.fontFamily,
            },
          ]}
        >
          {supportText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
  },
});
