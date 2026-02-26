import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { shareService, ShareLink } from '@/services/share.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

const CHANNEL_ICONS: Record<string, string> = { whatsapp: '💬', email: '📧', sms: '📱' };

export function ShareHistoryScreen() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      const result = await shareService.listLinks({ limit: 50 });
      setLinks(result.shareLinks);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLinks();
    setRefreshing(false);
  };

  const renderLink = ({ item }: { item: ShareLink }) => (
    <View style={styles.card}>
      <Text style={styles.channelIcon}>{CHANNEL_ICONS[item.channel] ?? '🔗'}</Text>
      <View style={styles.cardContent}>
        <Text style={styles.token} numberOfLines={1}>Token: {item.token.slice(0, 12)}...</Text>
        <Text style={styles.meta}>
          {item.viewCount} view{item.viewCount !== 1 ? 's' : ''} · {item.isActive ? 'Active' : 'Inactive'}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={[styles.badgeText, item.isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
          {item.isActive ? 'Active' : 'Expired'}
        </Text>
      </View>
    </View>
  );

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  return (
    <FlatList
      style={styles.container}
      data={links}
      keyExtractor={(item) => item.id}
      renderItem={renderLink}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No share links yet</Text>
          <Text style={styles.emptySubtitle}>Share property pages to see history here</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  channelIcon: { fontSize: 24, marginRight: spacing.md },
  cardContent: { flex: 1 },
  token: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeActive: { backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.errorLight },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  badgeTextActive: { color: colors.success },
  badgeTextInactive: { color: colors.error },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, marginTop: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
