import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Card, Screen, SectionHeader } from '../src/components/ui';
import { theme } from '../src/lib/theme';

const filterGroups = [
  { title: 'Exchange', options: ['All', 'Binance', 'CoinDCX', 'OKX', 'Kraken'] },
  { title: 'Minimum profit', options: ['Any', '$25+', '$100+', '$250+'] },
  { title: 'Confidence', options: ['Any', '70%+', '85%+', '95%+'] },
  { title: 'Risk', options: ['Any', 'Low', 'Medium', 'High'] },
  { title: 'Liquidity', options: ['Any', 'Medium+', 'High'] },
];

export default function ScannerFiltersScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>({
    Exchange: 'All',
    'Minimum profit': 'Any',
    Confidence: 'Any',
    Risk: 'Any',
    Liquidity: 'Any',
  });

  return (
    <Screen>
      <Text style={styles.title}>Filters</Text>
      <Text style={styles.subtitle}>
        Tune scanner results by exchange, profit, confidence, liquidity, and risk.
      </Text>

      {filterGroups.map((group) => (
        <View key={group.title}>
          <SectionHeader title={group.title} />
          <Card style={styles.card}>
            <View style={styles.chipWrap}>
              {group.options.map((option) => {
                const active = selected[group.title] === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      setSelected((current) => ({ ...current, [group.title]: option }))
                    }
                  >
                    <Badge label={option} variant={active ? 'default' : 'secondary'} />
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>
      ))}

      <View style={styles.actions}>
        <Button label="Apply filters" onPress={() => router.back()} style={styles.actionButton} />
        <Button
          label="Reset"
          variant="secondary"
          onPress={() =>
            setSelected({
              Exchange: 'All',
              'Minimum profit': 'Any',
              Confidence: 'Any',
              Risk: 'Any',
              Liquidity: 'Any',
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xxxl,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    lineHeight: theme.typography.lineHeight.base,
  },
  card: {
    padding: theme.spacing.lg,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actions: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});
