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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const handleRegister = async () => {
    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter an email address to create your account.';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address, for example you@profitflow.com.';
    }
    if (!password) {
      nextErrors.password = 'Create a password.';
    } else if (password.length < 6) {
      nextErrors.password = 'Use at least 6 characters.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const success = await signUp(email.trim(), password);
    if (success) {
      router.replace('/verify-email');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        Sign up to access live scanner data and portfolio insights.
      </Text>
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
          helperText="Use at least 6 characters."
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          textContentType="newPassword"
          onSubmitEditing={handleRegister}
        />
        <Button
          label={loading ? 'Creating account…' : 'Create account'}
          onPress={handleRegister}
          disabled={loading}
          style={styles.button}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
      <Button
        label="Already have an account? Sign in"
        variant="ghost"
        onPress={() => router.replace('/login')}
      />
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
    width: '100%',
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },
});
