import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { theme } from '../src/lib/theme';
import { useAuthStore } from '../src/store/auth-store';
import type { AuthState } from '../src/store/auth-store';

export default function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state: AuthState) => state.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const handleRegister = async () => {
    const success = await signUp(email, password);
    if (success) {
      router.replace('/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Sign up to access live scanner data and portfolio insights.</Text>
      <Card style={styles.card}>
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@profitflow.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        <Button label={loading ? 'Creating account…' : 'Create account'} onPress={handleRegister} disabled={loading} style={styles.button} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
      <Button label="Already have an account? Sign in" variant="ghost" onPress={() => router.replace('/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },
});
