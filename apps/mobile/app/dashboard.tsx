import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { EmptyState } from '../src/components/ui/EmptyState';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { Button, OpportunityCard, SectionHeader, StatPill } from '../src/components/ui';
import { theme } from '../src/lib/theme';
import { useDashboard, type MarketSnapshot } from '../src/lib/dashboard';
import { useProfile } from '../src/lib/profile';
import { useDashboardSocket } from '../src/lib/socket';

export default function DashboardScreen() {
  const router = useRouter();
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

  const groupedMarketSnapshots = useMemo(() => {
    const grouped = new Map<string, MarketSnapshot[]>();

    for (const snapshot of data?.marketSnapshots ?? []) {
      const key = snapshot.symbol.toUpperCase();
      const existing = grouped.get(key) ?? [];
      existing.push(snapshot);
      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).slice(0, 4);
  }, [data?.marketSnapshots]);

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
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.pageTitle}>Dashboard</Text>
          {profileQuery.data?.user?.email ? (
            <Text style={styles.welcomeText}>Welcome back, {profileQuery.data.user.email}</Text>
          ) : null}
        </View>
        <Button
          label="Alerts"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/notifications' as never)}
        />
      </View>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Scanner Health</Text>
          <Badge label={data.overallStatus.toUpperCase()} variant={healthVariant} />
        </View>
        <Text style={styles.heroValue}>{opportunityCount} opportunities</Text>
        <Text style={styles.heroSubtitle}>{data.connectedExchanges.join(' • ')}</Text>
        {liveCount !== null ? (
          <Text style={styles.liveSubtitle}>Live updates are active</Text>
        ) : null}
      </Card>

      <View style={styles.statRow}>
        <StatPill
          label="Exchanges"
          value={`${data.connectedExchanges.length}`}
          color={theme.colors.primary}
        />
        <StatPill label="Providers" value={`${data.providers.length}`} color={theme.colors.info} />
        <StatPill
          label="Markets"
          value={`${data.monitoredSymbolCount ?? 0}`}
          color={theme.colors.success}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Live Opportunities" style={styles.compactHeader} />
        {data.opportunities.length > 0 ? (
          data.opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              featured={opportunity.id === data.opportunities[0]?.id}
              onPress={() => router.push(`/opportunity/${opportunity.id}` as never)}
            />
          ))
        ) : (
          <>
            <EmptyState
              title="No active opportunities"
              description="Exchange data is live, but no profitable arbitrage opportunities passed validation yet."
            />
            {groupedMarketSnapshots.map((snapshots) => {
              const primary = snapshots[0];
              const prices = snapshots
                .filter((snapshot) => typeof snapshot.price === 'number')
                .map((snapshot) => snapshot.price)
                .sort((a, b) => a - b);
              const bestPrice = prices[0];
              const spread = prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0;

              return (
                <Card key={primary.symbol} style={styles.smallCard}>
                  <View style={styles.providerRow}>
                    <Text style={styles.providerName}>{primary.symbol}</Text>
                    <Badge label={`${snapshots.length} exchanges`} variant="secondary" />
                  </View>
                  <Text style={styles.providerMeta}>
                    Best price: ${bestPrice?.toLocaleString() ?? '—'}
                  </Text>
                  <Text style={styles.providerMeta}>Spread: ${spread.toLocaleString()}</Text>
                  {snapshots.map((snapshot) => (
                    <View
                      key={`${snapshot.exchange}-${snapshot.symbol}`}
                      style={styles.exchangePriceRow}
                    >
                      <Text style={styles.exchangePriceName}>{snapshot.exchange}</Text>
                      <Text style={styles.exchangePriceValue}>
                        ${snapshot.price.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </Card>
              );
            })}
          </>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Exchange Health" style={styles.compactHeader} />
        {data.providers.map((provider) => (
          <Card key={provider.provider} style={styles.smallCard}>
            <View style={styles.providerRow}>
              <Text style={styles.providerName}>{provider.provider}</Text>
              <Badge
                label={provider.status}
                variant={provider.status === 'healthy' ? 'success' : 'warning'}
              />
            </View>
            <Text style={styles.providerMeta}>
              Last update: {provider.lastMarketUpdateAt ?? 'N/A'}
            </Text>
            <Text style={styles.providerMeta}>Market snapshots: {data.marketDataCount ?? 0}</Text>
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
    marginBottom: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
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
  },
  statRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
  compactHeader: {
    marginTop: 0,
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
  exchangePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exchangePriceName: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  exchangePriceValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  cardText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
  },
});
