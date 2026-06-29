import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ValidatedOpportunity } from '@profitflow/shared';
import { theme } from '../../lib/theme';
import { Badge } from './Badge';
import { Card } from './Card';

interface OpportunityCardProps {
  opportunity: ValidatedOpportunity;
  featured?: boolean;
  onPress?: () => void;
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function OpportunityCard({ opportunity, featured = false, onPress }: OpportunityCardProps) {
  const riskVariant =
    opportunity.confidence >= 85 ? 'success' : opportunity.confidence >= 70 ? 'warning' : 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={[styles.card, featured && styles.featuredCard]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.symbol}>{opportunity.symbol}</Text>
            <Text style={styles.route}>
              Buy {opportunity.buyExchange} / Sell {opportunity.sellExchange}
            </Text>
          </View>
          <Badge label={`${opportunity.spreadPercentage.toFixed(2)}%`} variant="success" />
        </View>

        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricLabel}>Est. profit</Text>
            <Text style={styles.profit}>{formatCurrency(opportunity.estimatedProfit)}</Text>
          </View>
          <View style={styles.rightMetric}>
            <Text style={styles.metricLabel}>Confidence</Text>
            <Badge label={`${opportunity.confidence.toFixed(0)}%`} variant={riskVariant} />
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceText}>Buy {formatCurrency(opportunity.buyPrice)}</Text>
          <Text style={styles.priceText}>Sell {formatCurrency(opportunity.sellPrice)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  featuredCard: {
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  symbol: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  route: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  metrics: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.xs,
    marginBottom: 6,
  },
  profit: {
    color: theme.colors.success,
    fontSize: theme.typography.size.xxl,
    fontWeight: '800',
  },
  rightMetric: {
    alignItems: 'flex-end',
  },
  priceRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  priceText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
});
