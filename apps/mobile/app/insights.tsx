import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { useDashboard } from '../src/lib/dashboard';
import { theme } from '../src/lib/theme';

export default function InsightsScreen() {
  const dashboardQuery = useDashboard();

  if (dashboardQuery.isLoading) {
    return <LoadingView label="Loading insights…" />;
  }

  if (dashboardQuery.error) {
    return (
      <ErrorState
        title="Unable to load insights"
        description="Please try again to load your account insights."
        actionLabel="Retry"
        onAction={() => dashboardQuery.refetch()}
      />
    );
  }

  const providerCount = dashboardQuery.data?.providers.length ?? 0;
  const opportunityCount = dashboardQuery.data?.opportunities.length ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Scanner health</Text>
        <Text style={styles.cardText}>Overall status is {dashboardQuery.data?.overallStatus ?? 'unknown'}.</Text>
        <Text style={styles.cardText}>{providerCount} provider{providerCount === 1 ? '' : 's'} currently connected.</Text>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Opportunity summary</Text>
        <Text style={styles.cardText}>{opportunityCount} active opportunity{opportunityCount === 1 ? '' : 'ies'} currently cached.</Text>
        <Text style={styles.cardText}>Check the Dashboard for more live pricing and arbitrage details.</Text>
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
