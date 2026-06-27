import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { useDashboard } from '../src/lib/dashboard';
import { theme } from '../src/lib/theme';

export default function PortfolioScreen() {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isLoading) {
    return <LoadingView label="Loading portfolio details…" />;
  }

  if (dashboardQuery.error) {
    return (
      <ErrorState
        title="Unable to load portfolio"
        description="Please check your connection and try again."
        actionLabel="Retry"
        onAction={() => dashboardQuery.refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Connected Exchanges</Text>
        <Text style={styles.cardText}>
          {dashboardQuery.data?.connectedExchanges.length
            ? `You have ${dashboardQuery.data.connectedExchanges.length} connected exchange${dashboardQuery.data.connectedExchanges.length > 1 ? 's' : ''}.`
            : 'No exchanges connected yet.'}
        </Text>
        <Text style={styles.cardText}>
          {dashboardQuery.data?.opportunities.length
            ? `Found ${dashboardQuery.data.opportunities.length} recent opportunity${dashboardQuery.data.opportunities.length > 1 ? 'ies' : 'y'} across your connected exchanges.`
            : 'No recent opportunities found yet.'}
        </Text>
      </Card>
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
});
