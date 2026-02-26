import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl, Share,
} from 'react-native';
import { usePartnerStore } from '@/stores/partner.store';
import { Partner } from '@/services/partner.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

export function PartnerListScreen() {
  const {
    partners, isLoading, error,
    fetchPartners, createInvite, removePartner,
  } = usePartnerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPartners();
    setRefreshing(false);
  }, [fetchPartners]);

  const handleInvite = async () => {
    try {
      const invite = await createInvite();
      await Share.share({ message: `Join me as a partner on ImmoShare! Use invite code: ${invite.code}` });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create invite');
    }
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('Remove Partner', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePartner(id) },
    ]);
  };

  const renderPartner = ({ item }: { item: Partner }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => handleRemove(item.partnerId, item.partnerName)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.partnerName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.partnerName}</Text>
        <Text style={styles.email}>{item.partnerEmail}</Text>
        <Text style={styles.since}>Partner since {new Date(item.since).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorBanner}>{error}</Text>}

      <FlatList
        data={partners}
        keyExtractor={(item) => item.inviteId}
        renderItem={renderPartner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No partners yet</Text>
              <Text style={styles.emptySubtitle}>Invite other agents to collaborate</Text>
            </View>
          ) : null
        }
      />

      {isLoading && !refreshing && <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />}

      <TouchableOpacity style={styles.fab} onPress={handleInvite}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  errorBanner: { margin: spacing.md, padding: spacing.sm, backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.sm, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  cardContent: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  since: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, marginTop: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { fontSize: fontSize.xxl, color: '#FFF', fontWeight: '300' },
});
