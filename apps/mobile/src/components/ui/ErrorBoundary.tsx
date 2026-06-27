import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled app error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const theme = useTheme();

    if (this.state.hasError) {
      return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Something went wrong.</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>An unexpected error occurred. Please try restarting the app.</Text>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={this.handleReset}>
            <Text style={[styles.buttonLabel, { color: theme.colors.primaryForeground }]}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
