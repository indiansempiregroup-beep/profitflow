import { StyleSheet, Text, View } from 'react-native';
import type { MarketSnapshot } from '../../lib/dashboard';
import { theme } from '../../lib/theme';
import { Badge } from './Badge';
import { Card } from './Card';

interface MarketSnapshotCardProps {
  snapshot: MarketSnapshot;
}

const formatPrice = (value: number) =>
  `$${value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 1 ? 2 : 6,
  })}`;

export function MarketSnapshotCard({ snapshot }: MarketSnapshotCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{snapshot.symbol}</Text>
          <Text style={styles.exchange}>{snapshot.exchange}</Text>
        </View>
        <Badge
          label={snapshot.healthStatus}
          variant={snapshot.healthStatus === 'healthy' ? 'success' : 'warning'}
        />
      </View>
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.label}>Bid</Text>
          <Text style={styles.value}>{formatPrice(snapshot.bid)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.label}>Ask</Text>
          <Text style={styles.value}>{formatPrice(snapshot.ask)}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  symbol: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  exchange: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.xs,
    marginBottom: 4,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
  right: {
    alignItems: 'flex-end',
  },
});
