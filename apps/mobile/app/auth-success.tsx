import { Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Screen } from '../src/components/ui';
import { theme } from '../src/lib/theme';

export default function AuthSuccessScreen() {
  const router = useRouter();

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={46}
          color={theme.colors.success}
        />
      </View>
      <Text style={styles.title}>You are ready</Text>
      <Text style={styles.subtitle}>
        Connect an exchange to start scanning real arbitrage opportunities across markets.
      </Text>
      <Button
        label="Connect an exchange"
        onPress={() => router.replace('/exchange-setup' as never)}
        style={styles.button}
      />
      <Button
        label="Go to dashboard"
        variant="ghost"
        onPress={() => router.replace('/dashboard')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: theme.colors.success + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.xxxl,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    lineHeight: theme.typography.lineHeight.base,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.sm,
  },
});
