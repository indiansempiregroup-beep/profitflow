import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingView,
  Screen,
  SectionHeader,
} from '../src/components/ui';
import { useProfile } from '../src/lib/profile';
import { theme } from '../src/lib/theme';

const supported = ['Binance', 'CoinDCX', 'Bybit', 'OKX'];

export default function ExchangeManagementScreen() {
  const router = useRouter();
  const profile = useProfile();

  if (profile.isLoading) return <LoadingView label="Loading exchanges..." />;
  if (profile.error) {
    return (
      <ErrorState
        title="Unable to load exchanges"
        description="Please retry to load exchange connections."
        actionLabel="Retry"
        onAction={() => profile.refetch()}
      />
    );
  }

  const connected = new Set(profile.data?.connectedExchanges ?? []);

  return (
    <Screen>
      <Text style={styles.title}>Exchanges</Text>
      <Text style={styles.subtitle}>
        Manage the exchange connections used by the arbitrage scanner.
      </Text>
      <SectionHeader title="Connections" />
      {supported.map((name) => {
        const isConnected = connected.has(name);
        return (
          <Card key={name} style={styles.rowCard}>
            <View style={styles.exchangeRow}>
              <View style={styles.nameRow}>
                <MaterialCommunityIcons
                  name="server-network"
                  size={22}
                  color={theme.colors.primary}
                />
                <View>
                  <Text style={styles.exchangeName}>{name}</Text>
                  <Text style={styles.exchangeMeta}>
                    {isConnected ? 'Scanner enabled' : 'Not connected'}
                  </Text>
                </View>
              </View>
              <Badge
                label={isConnected ? 'Connected' : 'Setup'}
                variant={isConnected ? 'success' : 'secondary'}
              />
            </View>
          </Card>
        );
      })}
      <Button
        label="Connect new exchange"
        onPress={() => router.push('/exchange-setup' as never)}
        style={styles.button}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xxxl,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
  },
  rowCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  exchangeName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
  exchangeMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginTop: 2,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});
