import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingView,
  Screen,
  SectionHeader,
} from '../src/components/ui';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../src/lib/notifications';
import { theme } from '../src/lib/theme';

const typeColors: Record<string, string> = {
  Scanner: theme.colors.primary,
  Exchange: theme.colors.info,
  Security: theme.colors.warning,
  PaperTrade: theme.colors.success,
};

export default function NotificationsScreen() {
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (notificationsQuery.isLoading) {
    return <LoadingView label="Loading notifications…" />;
  }

  if (notificationsQuery.error) {
    return (
      <ErrorState
        title="Unable to load notifications"
        description="Please retry to load your alerts."
        actionLabel="Retry"
        onAction={() => notificationsQuery.refetch()}
      />
    );
  }

  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <Screen>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Scanner, exchange, security, and paper trade alerts.</Text>
      {notifications.some((item) => !item.read) ? (
        <Button
          label="Mark all as read"
          variant="ghost"
          onPress={() => markAllRead.mutate()}
          style={styles.markAll}
        />
      ) : null}
      <SectionHeader title="Recent alerts" />
      {notifications.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.cardText}>
            No alerts yet. New opportunities and account events will appear here.
          </Text>
        </Card>
      ) : (
        notifications.map((item) => {
          const color = typeColors[item.type] ?? theme.colors.primary;
          return (
            <Pressable key={item.id} onPress={() => !item.read && markRead.mutate(item.id)}>
              <Card style={[styles.card, !item.read && styles.unreadCard]}>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
                    <MaterialCommunityIcons name="bell-outline" size={20} color={color} />
                  </View>
                  <View style={styles.content}>
                    <View style={styles.header}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Badge label={item.type} variant="secondary" />
                    </View>
                    <Text style={styles.cardText}>{item.body}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
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
  },
  markAll: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  unreadCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.base,
    fontWeight: '700',
    flex: 1,
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  timestamp: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.sm,
  },
});
