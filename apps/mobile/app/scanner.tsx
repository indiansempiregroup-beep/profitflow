import { useMemo, useState } from 'react';
import { Pressable, View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { Badge, Button, Input, MarketSnapshotCard, OpportunityCard } from '../src/components/ui';
import { useDashboard, useMarketQuote } from '../src/lib/dashboard';
import { theme } from '../src/lib/theme';

const exchangeFilters = ['All', 'BINANCE', 'COINDCX', 'BYBIT', 'OKX'];
const coinAliases: Record<string, string> = {
  BITCOIN: 'BTC',
  ETHER: 'ETH',
  ETHEREUM: 'ETH',
  SOLANA: 'SOL',
  RIPPLE: 'XRP',
  CARDANO: 'ADA',
  DOGECOIN: 'DOGE',
  LITECOIN: 'LTC',
  AVALANCHE: 'AVAX',
  CHAINLINK: 'LINK',
};

const normalizeCoinSearch = (value: string) => {
  const query = value.trim().toUpperCase();
  return coinAliases[query] ?? query;
};

export default function ScannerScreen() {
  const router = useRouter();
  const dashboardQuery = useDashboard();
  const [search, setSearch] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState('All');

  const normalizedSearch = normalizeCoinSearch(search);
  const marketQuoteQuery = useMarketQuote(normalizedSearch || undefined);
  const opportunities = dashboardQuery.data?.opportunities ?? [];
  const marketSnapshots = dashboardQuery.data?.marketSnapshots ?? [];
  const connectedExchanges = dashboardQuery.data?.connectedExchanges ?? [];

  const quoteRows = useMemo(() => {
    const quotes = marketQuoteQuery.data?.quotes ?? [];
    const quoteMap = new Map(quotes.map((quote) => [quote.exchange.toUpperCase(), quote]));

    return connectedExchanges.map((exchange) => {
      const quote = quoteMap.get(exchange.toUpperCase());
      return {
        exchange,
        price: quote?.price,
        lastUpdated: quote?.lastUpdateAt,
        status: quote ? 'Live' : 'Waiting',
        isBest: Boolean(
          quote && quotes.every((candidate) => quote.price <= (candidate.price ?? quote.price)),
        ),
      };
    });
  }, [connectedExchanges, marketQuoteQuery.data?.quotes]);

  const bestQuote = quoteRows
    .filter((row) => row.price !== undefined)
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
  const spread =
    bestQuote && quoteRows.some((row) => row.price !== undefined)
      ? Math.max(
          ...quoteRows.filter((row) => row.price !== undefined).map((row) => row.price ?? 0),
        ) - (bestQuote.price ?? 0)
      : undefined;

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((opportunity) => {
        const matchesSearch =
          !normalizedSearch ||
          opportunity.symbol.toUpperCase().includes(normalizedSearch) ||
          opportunity.buyExchange.toUpperCase().includes(normalizedSearch) ||
          opportunity.sellExchange.toUpperCase().includes(normalizedSearch);
        const matchesExchange =
          exchangeFilter === 'All' ||
          opportunity.buyExchange.toUpperCase() === exchangeFilter ||
          opportunity.sellExchange.toUpperCase() === exchangeFilter;

        return matchesSearch && matchesExchange;
      }),
    [exchangeFilter, normalizedSearch, opportunities],
  );

  const filteredMarketSnapshots = useMemo(
    () =>
      marketSnapshots.filter((snapshot) => {
        const matchesSearch =
          !normalizedSearch ||
          snapshot.symbol.toUpperCase().includes(normalizedSearch) ||
          snapshot.exchange.toUpperCase().includes(normalizedSearch);
        const matchesExchange =
          exchangeFilter === 'All' || snapshot.exchange.toUpperCase() === exchangeFilter;

        return matchesSearch && matchesExchange;
      }),
    [exchangeFilter, marketSnapshots, normalizedSearch],
  );

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
      <View style={styles.titleRow}>
        <Text style={styles.title}>Scanner</Text>
        <Button
          label="Filters"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/scanner-filters' as never)}
        />
      </View>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Live opportunities</Text>
        <Text style={styles.cardText}>
          {opportunities.length
            ? `Showing ${filteredOpportunities.length} of ${opportunities.length} recent opportunities.`
            : `Scanning ${dashboardQuery.data?.monitoredSymbolCount ?? 0} markets. No profitable opportunities passed validation yet.`}
        </Text>
      </Card>

      <Card style={styles.filterCard}>
        <Input
          label="Search coin"
          placeholder="BTC, ETH, SOL, BTC/USDT..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="characters"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {normalizedSearch ? (
          <Card style={styles.quoteCard}>
            <Text style={styles.cardTitle}>
              {marketQuoteQuery.isFetching
                ? 'Refreshing live quotes…'
                : `Live quotes for ${normalizedSearch}`}
            </Text>
            {marketQuoteQuery.isError ? (
              <Text style={styles.cardText}>Unable to fetch fresh quotes right now.</Text>
            ) : quoteRows.length ? (
              <View>
                {bestQuote && spread !== undefined ? (
                  <View style={styles.quoteSummary}>
                    <Text style={styles.quoteSummaryText}>Best: {bestQuote.exchange}</Text>
                    <Text style={styles.quoteSummaryText}>Spread: ${spread.toLocaleString()}</Text>
                  </View>
                ) : null}
                <View style={styles.quoteList}>
                  {quoteRows.map((row) => (
                    <View key={row.exchange} style={styles.quoteRow}>
                      <View style={styles.quoteMeta}>
                        <Text style={styles.quoteExchange}>{row.exchange}</Text>
                        <Text style={styles.quoteStatus}>{row.status}</Text>
                      </View>
                      <Text style={row.isBest ? styles.quotePriceBest : styles.quotePrice}>
                        {row.price === undefined ? '—' : `$${row.price.toLocaleString()}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.cardText}>Waiting for live pricing…</Text>
            )}
          </Card>
        ) : null}
        <View style={styles.chipRow}>
          {exchangeFilters.map((exchange) => (
            <Pressable key={exchange} onPress={() => setExchangeFilter(exchange)}>
              <Badge
                label={exchange === 'All' ? 'All exchanges' : exchange}
                variant={exchangeFilter === exchange ? 'default' : 'secondary'}
              />
            </Pressable>
          ))}
        </View>
      </Card>

      {opportunities.length ? (
        <FlatList
          data={filteredOpportunities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OpportunityCard
              opportunity={item}
              onPress={() => router.push(`/opportunity/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={() => (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No opportunities match this search.</Text>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : normalizedSearch ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {marketQuoteQuery.data?.quotes?.length
              ? 'Live exchange prices for this coin are shown above in one consolidated view.'
              : 'No live market quotes are available for this search yet.'}
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredMarketSnapshots}
          keyExtractor={(item) => `${item.exchange}-${item.symbol}`}
          renderItem={({ item }) => <MarketSnapshotCard snapshot={item} />}
          ListHeaderComponent={() => (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {filteredMarketSnapshots.length
                  ? 'No profitable opportunities found right now. Live bid and ask data is flowing below.'
                  : 'No live markets match this search.'}
              </Text>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  quoteCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  quoteSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  quoteSummaryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  quoteList: {
    gap: theme.spacing.sm,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  quoteMeta: {
    flex: 1,
  },
  quoteExchange: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '600',
  },
  quoteStatus: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginTop: 2,
  },
  quotePrice: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '600',
  },
  quotePriceBest: {
    color: theme.colors.success,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
  filterCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
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
