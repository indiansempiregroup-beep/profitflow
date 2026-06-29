import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { type Href, useRouter, useSegments } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

interface TabItem {
  route: Href;
  label: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const tabs: TabItem[] = [
  { route: '/dashboard', label: 'Dashboard', iconName: 'view-dashboard' },
  { route: '/scanner', label: 'Scanner', iconName: 'magnify' },
  { route: '/portfolio', label: 'Portfolio', iconName: 'briefcase' },
  { route: '/insights', label: 'Insights', iconName: 'chart-line' },
  { route: '/settings', label: 'Settings', iconName: 'cog' },
];

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const activeRoute = `/${segments[0] ?? ''}`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = activeRoute === tab.route;

          return (
            <Pressable
              key={String(tab.route)}
              onPress={() => router.replace(tab.route)}
              style={styles.tabButton}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <MaterialCommunityIcons
                name={tab.iconName}
                size={24}
                color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: theme.typography.size.xs,
  },
});
