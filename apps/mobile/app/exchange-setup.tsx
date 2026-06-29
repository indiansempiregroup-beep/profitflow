import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, Card, Input, Screen, SectionHeader } from '../src/components/ui';
import { theme } from '../src/lib/theme';
import {
  useSaveExchangeConnection,
  useTestExchangeConnection,
  type ExchangeConnectionPayload,
} from '../src/lib/exchange-connections';

const exchanges = [
  {
    id: 'binance',
    name: 'Binance' as const,
    tag: 'Most popular',
    color: '#F3BA2F',
    enabled: true,
    needsPassphrase: false,
  },
  {
    id: 'coindcx',
    name: 'CoinDCX' as const,
    tag: 'India',
    color: '#1A6AFF',
    enabled: true,
    needsPassphrase: false,
  },
  {
    id: 'bybit',
    name: 'Bybit' as const,
    tag: 'Derivatives',
    color: '#F7A600',
    enabled: true,
    needsPassphrase: false,
  },
  {
    id: 'okx',
    name: 'OKX' as const,
    tag: 'Global',
    color: '#FFFFFF',
    enabled: true,
    needsPassphrase: true,
  },
];

export default function ExchangeSetupScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(exchanges[0]);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [tested, setTested] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const testConnection = useTestExchangeConnection();
  const saveConnection = useSaveExchangeConnection();

  const buildPayload = (): ExchangeConnectionPayload | null => {
    if (!selected.enabled) {
      setFormError(`${selected.name} support is coming soon.`);
      return null;
    }

    if (!apiKey.trim() || !secretKey.trim()) {
      setFormError('Paste both the API key and secret key before testing.');
      return null;
    }

    if (selected.needsPassphrase && !passphrase.trim()) {
      setFormError('OKX requires an API passphrase.');
      return null;
    }

    return {
      exchangeName: selected.name,
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      passphrase: selected.needsPassphrase ? passphrase.trim() : undefined,
    };
  };

  const handleTest = async () => {
    setFormError(null);
    setTested(false);
    const payload = buildPayload();
    if (!payload) return;

    try {
      await testConnection.mutateAsync(payload);
      setTested(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Connection test failed.');
    }
  };

  const handleSave = async () => {
    setFormError(null);
    const payload = buildPayload();
    if (!payload) return;

    try {
      await saveConnection.mutateAsync(payload);
      router.replace('/exchange-management' as never);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save exchange connection.');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Connect Exchange</Text>
      <Text style={styles.subtitle}>
        Add read-only API keys so ProfitFlow can scan balances, prices, and arbitrage routes.
      </Text>

      <SectionHeader title="Supported exchanges" />
      <View style={styles.exchangeGrid}>
        {exchanges.map((exchange) => {
          const active = selected.id === exchange.id;
          return (
            <Pressable
              key={exchange.id}
              onPress={() => {
                setSelected(exchange);
                setTested(false);
                setFormError(null);
              }}
              style={[styles.exchangeCard, active && styles.exchangeActive]}
            >
              <View style={[styles.logoDot, { backgroundColor: exchange.color }]} />
              <Text style={styles.exchangeName}>{exchange.name}</Text>
              <Badge
                label={exchange.enabled ? exchange.tag : 'Soon'}
                variant={exchange.enabled ? 'secondary' : 'warning'}
              />
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="API credentials" />
      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>{selected.name}</Text>
        <Text style={styles.cardText}>
          Use read-only permissions. Trading and withdrawal permissions should stay disabled.
        </Text>
        <Input
          label="API key"
          placeholder="Paste API key"
          value={apiKey}
          onChangeText={(value) => {
            setApiKey(value);
            setTested(false);
          }}
          autoCapitalize="none"
          editable={selected.enabled}
        />
        <Input
          label="Secret key"
          placeholder="Paste secret key"
          value={secretKey}
          onChangeText={(value) => {
            setSecretKey(value);
            setTested(false);
          }}
          autoCapitalize="none"
          secureTextEntry
          editable={selected.enabled}
        />
        {selected.needsPassphrase ? (
          <Input
            label="Passphrase"
            placeholder="OKX API passphrase"
            value={passphrase}
            onChangeText={(value) => {
              setPassphrase(value);
              setTested(false);
            }}
            autoCapitalize="none"
            secureTextEntry
            editable={selected.enabled}
          />
        ) : null}
        <View style={styles.guideRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={20}
            color={theme.colors.success}
          />
          <Text style={styles.guideText}>
            Read-only access keeps funds protected while scanner data stays live.
          </Text>
        </View>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        {tested ? (
          <Badge label="Connection test passed" variant="success" style={styles.statusBadge} />
        ) : null}
        {saveConnection.isSuccess ? (
          <Badge label="Connection saved" variant="success" style={styles.statusBadge} />
        ) : null}
        <Button
          label={testConnection.isPending ? 'Testing connection...' : 'Test connection'}
          onPress={handleTest}
          disabled={!selected.enabled || testConnection.isPending || saveConnection.isPending}
        />
        <Button
          label={saveConnection.isPending ? 'Saving connection...' : 'Save connection'}
          variant="secondary"
          onPress={handleSave}
          disabled={!selected.enabled || saveConnection.isPending || testConnection.isPending}
        />
        <Button
          label="Go to dashboard"
          variant="ghost"
          onPress={() => router.replace('/dashboard')}
        />
      </Card>
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
  exchangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  exchangeCard: {
    width: '47%',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  exchangeActive: {
    borderColor: theme.colors.primary,
  },
  logoDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  exchangeName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
  },
  formCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xl,
    fontWeight: '700',
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  guideRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  guideText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.sm,
  },
});
