import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShareStackParamList } from '@/navigation/types';
import { useContactStore } from '@/stores/contact.store';
import { shareService, ShareChannel } from '@/services/share.service';
import { Contact } from '@/services/contact.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<ShareStackParamList, 'ShareCreate'>;

const CHANNELS: { key: ShareChannel; label: string; icon: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'sms', label: 'SMS', icon: '📱' },
];

export function ShareCreateScreen({ route, navigation }: Props) {
  const pageId = route.params?.pageId;
  const { contacts, fetchContacts, isLoading } = useContactStore();
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedChannels, setSelectedChannels] = useState<Set<ShareChannel>>(new Set(['whatsapp']));
  const [isSending, setIsSending] = useState(false);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleChannel = (ch: ShareChannel) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  };

  const handleSend = async () => {
    if (!pageId) {
      Alert.alert('Error', 'No page selected. Please share from a property page.');
      return;
    }
    if (selectedContacts.size === 0) {
      Alert.alert('Error', 'Select at least one contact');
      return;
    }
    if (selectedChannels.size === 0) {
      Alert.alert('Error', 'Select at least one channel');
      return;
    }
    setIsSending(true);
    try {
      const result = await shareService.createBatch(pageId, {
        contactIds: Array.from(selectedContacts),
        channels: Array.from(selectedChannels),
      });
      Alert.alert('Success', `${result.batch.successCount} link(s) created`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create shares');
    } finally {
      setIsSending(false);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.contactRow, isSelected && styles.contactRowSelected]}
        onPress={() => toggleContact(item.id)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactDetail}>{item.email || item.phone || ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Channels</Text>
      <View style={styles.channelRow}>
        {CHANNELS.map((ch) => (
          <TouchableOpacity
            key={ch.key}
            style={[styles.channelChip, selectedChannels.has(ch.key) && styles.channelChipSelected]}
            onPress={() => toggleChannel(ch.key)}
          >
            <Text style={styles.channelIcon}>{ch.icon}</Text>
            <Text style={[styles.channelLabel, selectedChannels.has(ch.key) && styles.channelLabelSelected]}>
              {ch.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        Contacts ({selectedContacts.size} selected)
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No contacts. Add contacts first.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.sendButtonText}>
            Share with {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, padding: spacing.md, paddingBottom: spacing.xs },
  channelRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  channelChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  channelChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  channelIcon: { marginRight: spacing.xs },
  channelLabel: { fontSize: fontSize.sm, color: colors.text },
  channelLabelSelected: { color: colors.primary, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  contactRowSelected: { backgroundColor: colors.primaryLight },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkmark: { color: '#FFF', fontSize: fontSize.sm, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  contactDetail: { fontSize: fontSize.sm, color: colors.textSecondary },
  emptyText: { padding: spacing.lg, textAlign: 'center', color: colors.textSecondary },
  sendButton: { margin: spacing.md, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
});
