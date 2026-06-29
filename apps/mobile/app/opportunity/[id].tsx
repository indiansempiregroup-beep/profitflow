import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingView,
  ProgressBar,
  Screen,
  SectionHeader,
  StatPill,
} from '../../src/components/ui';
import { useDashboard } from '../../src/lib/dashboard';
import { useCreatePaperTrade } from '../../src/lib/paper-trades';
import { theme } from '../../src/lib/theme';

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dashboard = useDashboard();
  const createPaperTrade = useCreatePaperTrade();
  const [started, setStarted] = useState(false);

  if (dashboard.isLoading) return <LoadingView label="Loading opportunity..." />;
  if (dashboard.error) {
    return (
      <ErrorState
        title="Unable to load opportunity"
        description="Please retry to load scanner data."
        actionLabel="Retry"
        onAction={() => dashboard.refetch()}
      />
    );
  }

  const opportunity = dashboard.data?.opportunities.find((item) => item.id === id);

  if (!opportunity) {
    return (
      <ErrorState
        title="Opportunity not found"
        description="This opportunity may have expired or been replaced by newer market data."
      />
    );
  }

  const handlePaperTrade = async () => {
    try {
      await createPaperTrade.mutateAsync({
        opportunityId: opportunity.id,
        symbol: opportunity.symbol,
        buyExchange: opportunity.buyExchange,
        sellExchange: opportunity.sellExchange,
        buyPrice: opportunity.buyPrice,
        sellPrice: opportunity.sellPrice,
        estimatedProfit: opportunity.estimatedProfit,
        quantity: 1,
      });
      setStarted(true);
      Alert.alert('Paper trade opened', 'Your simulated trade is now tracked in Portfolio.', [
        { text: 'View portfolio', onPress: () => router.push('/portfolio' as never) },
        { text: 'Stay here', style: 'cancel' },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to open paper trade',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <Screen>
      <Text style={styles.kicker}>Opportunity Detail</Text>
      <Text style={styles.title}>{opportunity.symbol}</Text>
      <Text style={styles.subtitle}>
        Buy on {opportunity.buyExchange}, sell on {opportunity.sellExchange}
      </Text>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Badge label={`${opportunity.spreadPercentage.toFixed(2)}% spread`} variant="success" />
          <MaterialCommunityIcons name="star-outline" size={24} color={theme.colors.warning} />
        </View>
        <Text style={styles.profit}>{formatCurrency(opportunity.estimatedProfit)}</Text>
        <Text style={styles.heroLabel}>Estimated profit after scanner validation</Text>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <Text style={styles.confidenceValue}>{opportunity.confidence.toFixed(0)}%</Text>
        </View>
        <ProgressBar value={opportunity.confidence} color={theme.colors.success} />
      </Card>

      <SectionHeader title="Trade route" />
      <View style={styles.stats}>
        <StatPill
          label="Buy price"
          value={formatCurrency(opportunity.buyPrice)}
          color={theme.colors.success}
        />
        <StatPill
          label="Sell price"
          value={formatCurrency(opportunity.sellPrice)}
          color={theme.colors.danger}
        />
      </View>
      <View style={styles.stats}>
        <StatPill
          label="Trading fees"
          value={formatCurrency(opportunity.feeAnalysis.totalTradingFees)}
        />
        <StatPill
          label="Network fee"
          value={formatCurrency(opportunity.feeAnalysis.networkFee.amount)}
        />
      </View>

      <SectionHeader title="Risk and liquidity" />
      <Card style={styles.card}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Liquidity</Text>
          <Text style={styles.metricValue}>{opportunity.liquidityScore.score}/100</Text>
        </View>
        <Text style={styles.metricDescription}>{opportunity.liquidityScore.details}</Text>
        <View style={styles.divider} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Slippage estimate</Text>
          <Text style={styles.metricValue}>
            {opportunity.slippageEstimate.percentage.toFixed(2)}%
          </Text>
        </View>
        <Text style={styles.metricDescription}>{opportunity.slippageEstimate.details}</Text>
      </Card>

      <SectionHeader title="Timeline" />
      <Card style={styles.card}>
        <Text style={styles.timelineText}>
          Detected: {new Date(opportunity.detectedAt).toLocaleString()}
        </Text>
        <Text style={styles.timelineText}>
          Validated: {new Date(opportunity.validatedAt).toLocaleString()}
        </Text>
        <Text style={styles.timelineText}>
          Source data: {new Date(opportunity.sourceDataTimestamp).toLocaleString()}
        </Text>
      </Card>

      <Button
        label={
          started
            ? 'Paper trade opened'
            : createPaperTrade.isPending
              ? 'Opening paper trade…'
              : 'Start paper trade'
        }
        onPress={handlePaperTrade}
        disabled={createPaperTrade.isPending || started}
        style={styles.button}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xxxl,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    marginTop: theme.spacing.xs,
  },
  heroCard: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profit: {
    color: theme.colors.success,
    fontSize: 40,
    fontWeight: '800',
    marginTop: theme.spacing.lg,
  },
  heroLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.xs,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  confidenceLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  confidenceValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.sm,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
  metricDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    marginTop: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  timelineText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.xl,
  },
});
