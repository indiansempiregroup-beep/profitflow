import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { EmptyState } from '../src/components/ui/EmptyState';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { theme } from '../src/lib/theme';
import { useDashboard } from '../src/lib/dashboard';
import { useProfile } from '../src/lib/profile';
import { useDashboardSocket } from '../src/lib/socket';

export default function DashboardScreen() {
  const profileQuery = useProfile();
  const { data, error, isLoading, refetch } = useDashboard();
  const [liveCount, setLiveCount] = useState<number | null>(null);

  useDashboardSocket((message) => {
    if (message.type === 'dashboard.connected') {
      setLiveCount(message.payload.opportunityCount);
    }
  });

  const opportunityCount = useMemo(
    () => liveCount ?? data?.opportunities.length ?? 0,
    [data?.opportunities?.length, liveCount],
  );

  if (isLoading || profileQuery.isLoading) {
    return <LoadingView label="Loading dashboard data…" />;
  }

  if (error || profileQuery.error) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        description="There was a problem connecting to ProfitFlow. Please try again."
        actionLabel="Retry"
        onAction={() => {
          refetch();
          profileQuery.refetch();
        }}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No data available"
        description="Dashboard data is not available at the moment."
      />
    );
  }

  const healthVariant = (data?.overallStatus ?? 'stale') === 'healthy' ? 'success' : 'warning';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Dashboard</Text>
      {profileQuery.data?.user?.email ? (
        <Text style={styles.welcomeText}>Welcome back, {profileQuery.data.user.email}</Text>
      ) : null}
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Scanner Health</Text>
          <Badge label={data.overallStatus.toUpperCase()} variant={healthVariant} />
        </View>
        <Text style={styles.heroValue}>{opportunityCount} opportunities</Text>
        <Text style={styles.heroSubtitle}>{data.connectedExchanges.join(' • ')}</Text>
        {liveCount !== null ? <Text style={styles.liveSubtitle}>Live updates are active</Text> : null}
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Opportunities</Text>
        {data.opportunities.length === 0 ? (
          <EmptyState
            title="No active opportunities"
            description="The scanner is still warming up or no profitable arbitrage opportunities were found yet."
          />
        ) : (
          data.opportunities.map((opportunity) => (
            <Card key={opportunity.id} style={styles.opportunityCard}>
              <Text style={styles.opportunitySymbol}>{opportunity.symbol}</Text>
              <Text style={styles.opportunityMeta}>
                {opportunity.buyExchange} → {opportunity.sellExchange} · {opportunity.spreadPercentage.toFixed(2)}% spread
              </Text>
              <View style={styles.opportunityStats}>
                <Text style={styles.opportunityStatLabel}>Buy</Text>
                <Text style={styles.opportunityStatValue}>${opportunity.buyPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.opportunityStats}>
                <Text style={styles.opportunityStatLabel}>Sell</Text>
                <Text style={styles.opportunityStatValue}>${opportunity.sellPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.opportunityStats}>
                <Text style={styles.opportunityStatLabel}>Confidence</Text>
                <Text style={styles.opportunityStatValue}>{opportunity.confidence.toFixed(0)}%</Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exchange Health</Text>
        {data.providers.map((provider) => (
          <Card key={provider.provider} style={styles.smallCard}>
            <View style={styles.providerRow}>
              <Text style={styles.providerName}>{provider.provider}</Text>
              <Badge label={provider.status} variant={provider.status === 'healthy' ? 'success' : 'warning'} />
            </View>
            <Text style={styles.providerMeta}>
              Last update: {provider.lastMarketUpdateAt ?? 'N/A'}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  pageTitle: {
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  heroCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  heroTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  heroSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    marginTop: theme.spacing.sm,
  },
  liveSubtitle: {
    color: theme.colors.success,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  heroValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
  },
  welcomeText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    marginTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  opportunityCard: {
    padding: theme.spacing.lg,
  },
  opportunitySymbol: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xl,
    fontWeight: '600',
    marginBottom: 6,
  },
  opportunityMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    marginBottom: theme.spacing.md,
  },
  opportunityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  opportunityStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  opportunityStatValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
  smallCard: {
    padding: theme.spacing.lg,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: theme.typography.size.base,
  },
  providerMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  cardText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
  },
});
