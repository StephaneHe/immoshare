import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNotificationStore } from '@/stores/notification.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

const SETTING_ITEMS = [
  { key: 'emailEnabled', label: 'Email Notifications', description: 'Receive notifications via email' },
  { key: 'pushEnabled', label: 'Push Notifications', description: 'Receive push notifications on device' },
  { key: 'shareViewed', label: 'Share Viewed', description: 'When someone views your shared page' },
  { key: 'partnerRequest', label: 'Partner Requests', description: 'New partner invitations' },
  { key: 'systemUpdates', label: 'System Updates', description: 'App updates and announcements' },
] as const;

export function NotificationSettingsScreen() {
  const { settings, isLoading, fetchSettings, updateSettings } = useNotificationStore();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (settings) setLocalSettings(settings); }, [settings]);

  const handleToggle = async (key: string, value: boolean) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated as typeof settings);
    await updateSettings({ [key]: value });
  };

  if (isLoading && !settings) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {SETTING_ITEMS.map((item) => (
          <View key={item.key} style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDescription}>{item.description}</Text>
            </View>
            <Switch
              value={localSettings?.[item.key as keyof typeof localSettings] as boolean ?? false}
              onValueChange={(v) => handleToggle(item.key, v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={localSettings?.[item.key as keyof typeof localSettings] ? colors.primary : colors.textLight}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  card: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  rowDescription: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
