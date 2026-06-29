import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { theme } from '../src/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProfitFlow</Text>
      <Text style={styles.subtitle}>
        A premium arbitrage intelligence platform for crypto traders.
      </Text>
      <Card style={styles.card}>
        <Text style={styles.cardText}>
          Discover actionable opportunities, connect exchanges, and manage your trading insights in
          one secure app.
        </Text>
        <Button label="Sign in" onPress={() => router.push('/login')} style={styles.button} />
        <Button
          label="Create account"
          variant="secondary"
          onPress={() => router.push('/register')}
          style={[styles.button, styles.secondaryButton]}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
  secondaryButton: {
    borderColor: theme.colors.primary,
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    marginBottom: theme.spacing.lg,
  },
});
