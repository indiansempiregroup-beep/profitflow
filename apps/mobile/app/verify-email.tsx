import { useState } from 'react';
import { Alert, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Input, Screen } from '../src/components/ui';
import { useSendVerificationCode, useVerifyEmail } from '../src/lib/auth';
import { theme } from '../src/lib/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const verifyEmailMutation = useVerifyEmail();
  const resendCode = useSendVerificationCode();
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit verification code.');
      return;
    }

    try {
      await verifyEmailMutation.mutateAsync(code.trim());
      router.replace('/auth-success' as never);
    } catch (error) {
      Alert.alert(
        'Verification failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleResend = async () => {
    try {
      await resendCode.mutateAsync();
      Alert.alert(
        'Code sent',
        'A new verification code has been generated. Check server logs in development.',
      );
    } catch (error) {
      Alert.alert(
        'Unable to resend code',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="email-check-outline" size={32} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        Enter the verification code sent to your inbox to protect your ProfitFlow account.
      </Text>
      <Card style={styles.card}>
        <Input
          label="Verification code"
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          label={verifyEmailMutation.isPending ? 'Verifying…' : 'Verify email'}
          onPress={handleVerify}
          disabled={verifyEmailMutation.isPending}
        />
        <Button
          label={resendCode.isPending ? 'Sending…' : 'Resend code'}
          variant="ghost"
          onPress={handleResend}
          disabled={resendCode.isPending}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
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
});
