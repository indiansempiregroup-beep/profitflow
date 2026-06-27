import React, { createContext, useContext, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from './theme';

export const ThemeContext = createContext(theme);

export function useTheme(): typeof theme {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </ThemeContext.Provider>
  );
}
