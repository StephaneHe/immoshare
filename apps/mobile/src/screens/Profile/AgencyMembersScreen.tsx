import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput, RefreshControl,
} from 'react-native';
import { agencyService, AgencyMember, AgencyInvite } from '@/services/agency.service';
import { useAuthStore } from '@/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

export function AgencyMembersScreen() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [invites, setInvites] = useState<AgencyInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.agencyId) return;
    try {
      const [m, i] = await Promise.all([
        agencyService.listMembers(user.agencyId),
        agencyService.listInvites(user.agencyId),
      ]);
      setMembers(m);
      setInvites(i);
    } catch {
      Alert.alert('Error', 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.agencyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user?.agencyId) return;
    try {
      const invite = await agencyService.createInvite(user.agencyId, inviteEmail.trim());
      setInvites((prev) => [...prev, invite]);
      setInviteEmail('');
      Alert.alert('Success', 'Invitation sent');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to invite');
    }
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (!user?.agencyId) return;
    Alert.alert('Remove Member', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await agencyService.removeMember(user.agencyId!, id);
          setMembers((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  return (
    <View style={styles.container}>
      {/* Invite bar */}
      <View style={styles.inviteBar}>
        <TextInput
          style={styles.inviteInput}
          placeholder="Email to invite..."
          value={inviteEmail}
          onChangeText={setInviteEmail}
          keyboardType="email-address"
          placeholderTextColor={colors.textLight}
        />
        <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Pending invites */}
      {invites.filter((i) => i.status === 'pending').length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Invites</Text>
          {invites.filter((i) => i.status === 'pending').map((invite) => (
            <View key={invite.id} style={styles.inviteRow}>
              <Text style={styles.inviteEmail}>{invite.email}</Text>
              <Text style={styles.inviteStatus}>Pending</Text>
            </View>
          ))}
        </View>
      )}

      {/* Members */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>{members.length} Member{members.length !== 1 ? 's' : ''}</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memberRow}
            onLongPress={() => handleRemoveMember(item.id, item.name)}
          >
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberEmail}>{item.email}</Text>
            </View>
            <Text style={styles.memberRole}>{item.role}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  inviteBar: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  inviteInput: { flex: 1, padding: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md, color: colors.text },
  inviteButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.md, justifyContent: 'center' },
  inviteButtonText: { color: '#FFF', fontWeight: '600' },
  section: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, padding: spacing.md },
  inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  inviteEmail: { fontSize: fontSize.sm, color: colors.text },
  inviteStatus: { fontSize: fontSize.xs, color: colors.warning, fontWeight: '600' },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  memberAvatarText: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  memberInfo: { flex: 1 },
  memberName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  memberEmail: { fontSize: fontSize.xs, color: colors.textSecondary },
  memberRole: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', textTransform: 'uppercase' },
});
