import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { Button, SectionHeader, StatPill } from '../src/components/ui';
import { usePortfolio } from '../src/lib/portfolio';
import { useClosePaperTrade } from '../src/lib/paper-trades';
import { theme } from '../src/lib/theme';

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function PortfolioScreen() {
  const router = useRouter();
  const portfolioQuery = usePortfolio();
  const closePaperTrade = useClosePaperTrade();

  if (portfolioQuery.isLoading) {
    return <LoadingView label="Loading portfolio details…" />;
  }

  if (portfolioQuery.error) {
    return (
      <ErrorState
        title="Unable to load portfolio"
        description="Please check your connection and try again."
        actionLabel="Retry"
        onAction={() => portfolioQuery.refetch()}
      />
    );
  }

  const data = portfolioQuery.data;
  const connectedExchanges = data?.connectedExchanges ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <Text style={styles.subtitle}>
        Live balances from connected exchanges and your paper trading activity.
      </Text>

      <Card style={styles.heroCard}>
        <Text style={styles.cardTitle}>Overview</Text>
        <Text style={styles.cardText}>
          {connectedExchanges.length
            ? `${connectedExchanges.length} connected exchange${connectedExchanges.length > 1 ? 's' : ''}`
            : 'No exchanges connected yet.'}
        </Text>
        <Text style={styles.cardText}>
          Open paper trades: {data?.summary.openPaperTradeCount ?? 0} · Estimated P/L{' '}
          {formatCurrency(data?.summary.totalEstimatedProfit ?? 0)}
        </Text>
        <Text style={styles.cardText}>
          Realized paper P/L: {formatCurrency(data?.summary.totalRealizedProfit ?? 0)}
        </Text>
      </Card>

      <View style={styles.stats}>
        <StatPill
          label="Connected"
          value={`${connectedExchanges.length}`}
          color={theme.colors.primary}
        />
        <StatPill
          label="Open trades"
          value={`${data?.summary.openPaperTradeCount ?? 0}`}
          color={theme.colors.info}
        />
        <StatPill
          label="Realized"
          value={formatCurrency(data?.summary.totalRealizedProfit ?? 0)}
          color={theme.colors.success}
        />
      </View>

      <SectionHeader title="Exchange balances" />
      {(data?.exchangeBalances.length ? data.exchangeBalances : []).map((snapshot) => (
        <Card key={snapshot.exchangeName} style={styles.exchangeCard}>
          <Text style={styles.exchangeName}>{snapshot.exchangeName}</Text>
          {snapshot.error ? (
            <Text style={styles.errorText}>{snapshot.error}</Text>
          ) : snapshot.balances.length === 0 ? (
            <Text style={styles.cardText}>No non-zero balances returned.</Text>
          ) : (
            snapshot.balances.slice(0, 5).map((balance) => (
              <View key={`${snapshot.exchangeName}-${balance.asset}`} style={styles.balanceRow}>
                <Text style={styles.balanceAsset}>{balance.asset}</Text>
                <Text style={styles.balanceValue}>
                  {balance.total.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </Text>
              </View>
            ))
          )}
        </Card>
      ))}

      {!connectedExchanges.length ? (
        <Button
          label="Connect an exchange"
          onPress={() => router.push('/exchange-setup' as never)}
          style={styles.button}
        />
      ) : null}

      <SectionHeader title="Open paper trades" />
      {(data?.paperTrades.open.length ? data.paperTrades.open : []).map((trade) => (
        <Card key={trade.id} style={styles.tradeCard}>
          <Text style={styles.exchangeName}>{trade.symbol}</Text>
          <Text style={styles.cardText}>
            Buy {trade.buyExchange} @ {formatCurrency(trade.buyPrice)} · Sell {trade.sellExchange} @{' '}
            {formatCurrency(trade.sellPrice)}
          </Text>
          <Text style={styles.cardText}>
            Estimated profit: {formatCurrency(trade.estimatedProfit)}
          </Text>
          <Button
            label={closePaperTrade.isPending ? 'Closing…' : 'Close at estimate'}
            variant="secondary"
            onPress={() =>
              closePaperTrade.mutate({ tradeId: trade.id, realizedProfit: trade.estimatedProfit })
            }
            disabled={closePaperTrade.isPending}
            style={styles.closeButton}
          />
        </Card>
      ))}

      <SectionHeader title="Recent closed trades" />
      {(data?.paperTrades.closed.length ? data.paperTrades.closed : []).map((trade) => (
        <Card key={trade.id} style={styles.tradeCard}>
          <Text style={styles.exchangeName}>{trade.symbol}</Text>
          <Text style={styles.cardText}>
            Realized profit: {formatCurrency(trade.realizedProfit ?? 0)}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    lineHeight: theme.typography.lineHeight.base,
    marginBottom: theme.spacing.xl,
  },
  heroCard: {
    padding: theme.spacing.xl,
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
    marginBottom: theme.spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  exchangeCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tradeCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  exchangeName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  balanceAsset: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  balanceValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.sm,
  },
  button: {
    marginBottom: theme.spacing.xl,
  },
  closeButton: {
    marginTop: theme.spacing.sm,
  },
});
