import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { MarketSnapshotCard, ProgressBar, SectionHeader, StatPill } from '../src/components/ui';
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
  const marketCount = dashboardQuery.data?.monitoredSymbolCount ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>
        Scanner intelligence distilled into health, activity, and confidence signals.
      </Text>
      <View style={styles.stats}>
        <StatPill label="Providers" value={`${providerCount}`} color={theme.colors.primary} />
        <StatPill label="Live opps" value={`${opportunityCount}`} color={theme.colors.success} />
        <StatPill label="Markets" value={`${marketCount}`} color={theme.colors.info} />
      </View>

      <SectionHeader title="Scanner health" />
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Scanner health</Text>
        <Text style={styles.cardText}>
          Overall status is {dashboardQuery.data?.overallStatus ?? 'unknown'}.
        </Text>
        <Text style={styles.cardText}>
          {providerCount} provider{providerCount === 1 ? '' : 's'} currently connected.
        </Text>
        <Text style={styles.cardText}>
          {dashboardQuery.data?.marketDataCount ?? 0} live market snapshots collected.
        </Text>
      </Card>

      <SectionHeader title="Provider status" />
      {(dashboardQuery.data?.providers ?? []).map((provider) => (
        <Card key={provider.provider} style={styles.card}>
          <View style={styles.qualityHeader}>
            <Text style={styles.cardTitle}>{provider.provider}</Text>
            <Text style={styles.confidence}>{provider.status}</Text>
          </View>
          <Text style={styles.cardText}>Last update: {provider.lastMarketUpdateAt ?? 'N/A'}</Text>
        </Card>
      ))}

      <SectionHeader title="Opportunity quality" />
      {opportunityCount
        ? (dashboardQuery.data?.opportunities ?? []).slice(0, 3).map((opportunity) => (
            <Card key={opportunity.id} style={styles.qualityCard}>
              <View style={styles.qualityHeader}>
                <Text style={styles.cardTitle}>{opportunity.symbol}</Text>
                <Text style={styles.confidence}>{opportunity.confidence.toFixed(0)}%</Text>
              </View>
              <ProgressBar
                value={opportunity.confidence}
                color={opportunity.confidence >= 80 ? theme.colors.success : theme.colors.warning}
              />
              <Text style={styles.cardText}>
                {opportunity.spreadPercentage.toFixed(2)}% spread across {opportunity.buyExchange}{' '}
                and {opportunity.sellExchange}.
              </Text>
            </Card>
          ))
        : (dashboardQuery.data?.marketSnapshots ?? [])
            .slice(0, 3)
            .map((snapshot) => (
              <MarketSnapshotCard
                key={`${snapshot.exchange}-${snapshot.symbol}`}
                snapshot={snapshot}
              />
            ))}

      <SectionHeader title="Summary" />
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Opportunity summary</Text>
        <Text style={styles.cardText}>
          {opportunityCount} active opportunity{opportunityCount === 1 ? '' : 'ies'} currently
          passed fee and slippage validation.
        </Text>
        <Text style={styles.cardText}>
          Live pricing is available even when no opportunity is profitable enough to display.
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
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    lineHeight: theme.typography.lineHeight.base,
    marginBottom: theme.spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    lineHeight: theme.typography.lineHeight.base,
    marginTop: theme.spacing.xs,
  },
  qualityCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidence: {
    color: theme.colors.success,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
});
