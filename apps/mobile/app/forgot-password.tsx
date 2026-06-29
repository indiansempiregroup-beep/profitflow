import { useState } from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Input, Screen } from '../src/components/ui';
import { useRequestPasswordReset } from '../src/lib/auth';
import { theme } from '../src/lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const requestReset = useRequestPasswordReset();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();

  const handleSend = async () => {
    if (!email.trim()) {
      setEmailError('Enter the email address for your account.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Enter a valid email address, for example you@profitflow.com.');
      return;
    }

    try {
      await requestReset.mutateAsync(email.trim());
      setSent(true);
    } catch (error) {
      Alert.alert(
        'Unable to send reset email',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <Text style={styles.kicker}>Account recovery</Text>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter your email and ProfitFlow will generate a reset token. In development, the token is
        logged by the server.
      </Text>

      <Card style={styles.card}>
        {sent ? (
          <>
            <Text style={styles.cardTitle}>Check your inbox</Text>
            <Text style={styles.cardText}>
              If an account exists for {email || 'your email address'}, reset instructions have been
              sent.
            </Text>
            <Button label="Back to sign in" onPress={() => router.replace('/login')} />
          </>
        ) : (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError(undefined);
              }}
              errorText={emailError}
              placeholder="you@profitflow.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              label={requestReset.isPending ? 'Sending…' : 'Send reset link'}
              onPress={handleSend}
              disabled={requestReset.isPending}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
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
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    lineHeight: theme.typography.lineHeight.base,
    marginBottom: theme.spacing.xl,
  },
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontWeight: '700',
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
    lineHeight: theme.typography.lineHeight.base,
  },
});
