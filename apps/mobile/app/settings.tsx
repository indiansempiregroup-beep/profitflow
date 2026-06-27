import { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { ErrorState } from '../src/components/ui/ErrorState';
import { LoadingView } from '../src/components/ui/LoadingView';
import { useProfile } from '../src/lib/profile';
import { useAuthStore } from '../src/store/auth-store';
import { theme } from '../src/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const profileQuery = useProfile();
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/welcome');
  }, [router, signOut]);

  if (profileQuery.isLoading) {
    return <LoadingView label="Loading settings…" />;
  }

  if (profileQuery.error) {
    return (
      <ErrorState
        title="Unable to load settings"
        description="There was a problem loading your profile."
        actionLabel="Retry"
        onAction={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.cardText}>Signed in as {profileQuery.data?.user.email ?? 'Unknown user'}.</Text>
        <Text style={styles.cardText}>
          {profileQuery.data?.connectedExchanges.length
            ? `${profileQuery.data.connectedExchanges.length} connected exchange${profileQuery.data.connectedExchanges.length > 1 ? 's' : ''}.`
            : 'No connected exchanges yet.'}
        </Text>
        <Button label="Logout" variant="danger" onPress={handleSignOut} style={styles.logoutButton} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.size.xxxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.base,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
  },
});
