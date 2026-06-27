import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ConnectivityBannerProps {
  isOffline: boolean;
}

export function ConnectivityBanner({ isOffline }: ConnectivityBannerProps) {
  const theme = useTheme();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.colors.danger }]}> 
      <Text style={[styles.text, { color: theme.colors.primaryForeground }]}>You are offline. Some data may be stale.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
