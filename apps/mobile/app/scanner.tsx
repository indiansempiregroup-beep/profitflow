import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { useDashboard } from '../src/lib/dashboard';
import { theme } from '../src/lib/theme';

export default function ScannerScreen() {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isLoading) {
    return <LoadingView label="Loading scanner details…" />;
  }

  if (dashboardQuery.error) {
    return (
      <ErrorState
        title="Unable to load scanner"
        description="Please retry to connect your account."
        actionLabel="Retry"
        onAction={() => dashboardQuery.refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Live opportunities</Text>
        <Text style={styles.cardText}>
          {dashboardQuery.data?.opportunities.length
            ? `Showing ${dashboardQuery.data.opportunities.length} recent opportunities from ${dashboardQuery.data.connectedExchanges.length} connected exchange${dashboardQuery.data.connectedExchanges.length > 1 ? 's' : ''}.`
            : 'No opportunities are available yet. The scanner is still warming up.'}
        </Text>
      </Card>

      <FlatList
        data={dashboardQuery.data?.opportunities ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.opportunityCard}>
            <Text style={styles.opportunitySymbol}>{item.symbol}</Text>
            <Text style={styles.opportunityMeta}>
              {item.buyExchange} → {item.sellExchange} · {item.spreadPercentage.toFixed(2)}%
            </Text>
            <Text style={styles.opportunityText}>Buy ${item.buyPrice.toFixed(2)} · Sell ${item.sellPrice.toFixed(2)}</Text>
          </Card>
        )}
        ListEmptyComponent={() => (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No opportunities found. Check back once your scanner has collected more market data.</Text>
          </Card>
        )}
        contentContainerStyle={dashboardQuery.data?.opportunities.length ? styles.listContent : styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
  },
  opportunityCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  opportunitySymbol: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xl,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  opportunityMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm,
  },
  opportunityText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
  },
  emptyCard: {
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
});
