import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { theme } from '../src/lib/theme';
import { useAuthStore } from '../src/store/auth-store';
import type { AuthState } from '../src/store/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state: AuthState) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const handleLogin = async () => {
    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter the email address for your account.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address, for example you@profitflow.com.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const success = await signIn(email.trim(), password);
    if (success) {
      router.replace('/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue scanning opportunities.</Text>
      <Card style={styles.card}>
        <Input
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          errorText={fieldErrors.email}
          placeholder="you@profitflow.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          errorText={fieldErrors.password}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={handleLogin}
        />
        <Button
          label="Forgot password?"
          variant="ghost"
          onPress={() => router.push('/forgot-password' as never)}
        />
        <Button
          label={loading ? 'Signing in…' : 'Sign In'}
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
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
  },
  button: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },
});
