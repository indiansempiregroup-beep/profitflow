import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Card,
  ErrorState,
  LoadingView,
  Screen,
  SectionHeader,
  StatPill,
} from '../src/components/ui';
import { useProfile } from '../src/lib/profile';
import { theme } from '../src/lib/theme';

export default function ProfileScreen() {
  const profile = useProfile();

  if (profile.isLoading) return <LoadingView label="Loading profile..." />;
  if (profile.error) {
    return (
      <ErrorState
        title="Unable to load profile"
        description="Please retry to load account details."
        actionLabel="Retry"
        onAction={() => profile.refetch()}
      />
    );
  }

  return (
    <Screen>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="account-outline" size={34} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>{profile.data?.user.email ?? 'Unknown user'}</Text>

      <SectionHeader title="Account details" />
      <Card style={styles.card}>
        <Text style={styles.label}>User ID</Text>
        <Text style={styles.value}>{profile.data?.user.id ?? 'Unavailable'}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.data?.user.email ?? 'Unavailable'}</Text>
      </Card>

      <SectionHeader title="Scanner profile" />
      <View style={styles.stats}>
        <StatPill
          label="Connected"
          value={`${profile.data?.exchangeConnectionCount ?? 0}`}
          color={theme.colors.success}
        />
        <StatPill label="Status" value="Running" color={theme.colors.primary} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '22',
    marginBottom: theme.spacing.lg,
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
  card: {
    padding: theme.spacing.lg,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    marginBottom: 4,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});
