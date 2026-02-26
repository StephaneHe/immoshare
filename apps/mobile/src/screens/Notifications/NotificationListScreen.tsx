import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NotificationsStackParamList } from '@/navigation/types';
import { useNotificationStore } from '@/stores/notification.store';
import { Notification } from '@/services/notification.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<NotificationsStackParamList, 'NotificationList'>;

const NOTIFICATION_ICONS: Record<string, string> = {
  share_viewed: '👀',
  partner_request: '🤝',
  partner_accepted: '✅',
  system: '🔔',
  default: '📌',
};

export function NotificationListScreen({ navigation }: Props) {
  const {
    notifications, unreadCount, isLoading, error,
    fetchNotifications, fetchUnreadCount, markAsRead,
    markAllAsRead, deleteNotification,
  } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    await fetchUnreadCount();
    setRefreshing(false);
  }, [fetchNotifications, fetchUnreadCount]);

  const handlePress = async (item: Notification) => {
    if (!item.isRead) await markAsRead(item.id);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => handlePress(item)}
      onLongPress={() => handleDelete(item.id)}
    >
      <Text style={styles.icon}>
        {NOTIFICATION_ICONS[item.type] ?? NOTIFICATION_ICONS.default}
      </Text>
      <View style={styles.cardContent}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBar} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>
            {unreadCount} unread — Mark all as read
          </Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.errorBanner}>{error}</Text>}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          ) : null
        }
      />

      {isLoading && !refreshing && (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => navigation.navigate('NotificationSettings')}
      >
        <Text style={styles.settingsText}>⚙️ Notification Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  markAllBar: { padding: spacing.md, backgroundColor: colors.primaryLight, alignItems: 'center' },
  markAllText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  errorBanner: { margin: spacing.md, padding: spacing.sm, backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.sm, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardUnread: { backgroundColor: '#F0F7FF' },
  icon: { fontSize: 24, marginRight: spacing.md },
  cardContent: { flex: 1 },
  title: { fontSize: fontSize.md, color: colors.text },
  titleUnread: { fontWeight: '700' },
  body: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, marginTop: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
  settingsButton: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  settingsText: { color: colors.primary, fontSize: fontSize.md },
});
