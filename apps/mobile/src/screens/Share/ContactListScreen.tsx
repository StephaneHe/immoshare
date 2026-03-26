import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShareStackParamList } from '@/navigation/types';
import { useContactStore } from '@/stores/contact.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { Contact } from '@/services/contact.service';

type Props = NativeStackScreenProps<ShareStackParamList, 'ContactList'>;

export function ContactListScreen({ navigation }: Props) {
  const {
    contacts, total, isLoading, error, search,
    fetchContacts, setSearch, deleteContact,
  } = useContactStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    fetchContacts();
  }, [setSearch, fetchContacts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  }, [fetchContacts]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Contact', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteContact(id) },
    ]);
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ContactDetail', { id: item.id })}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.email && <Text style={styles.contactInfo}>{item.email}</Text>}
        {item.phone && <Text style={styles.contactInfo}>{item.phone}</Text>}
        {item.company && <Text style={styles.contactCompany}>{item.company}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search contacts..."
        value={search}
        onChangeText={handleSearch}
        placeholderTextColor={colors.textLight}
      />
      <Text style={styles.resultCount}>{total} contact{total !== 1 ? 's' : ''}</Text>

      {error && <Text style={styles.errorBanner}>{error}</Text>}

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptySubtitle}>Add contacts to share properties</Text>
            </View>
          ) : null
        }
        contentContainerStyle={!contacts || contacts.length === 0 ? styles.emptyContainer : undefined}
      />

      {isLoading && !refreshing && (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ShareCreate', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchInput: {
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    fontSize: fontSize.md, color: colors.text,
  },
  resultCount: { paddingHorizontal: spacing.md, color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  errorBanner: { margin: spacing.md, padding: spacing.sm, backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.sm, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  cardContent: { flex: 1 },
  contactName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  contactInfo: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  contactCompany: { fontSize: fontSize.xs, color: colors.primary, marginTop: 2 },
  chevron: { fontSize: fontSize.xl, color: colors.textLight },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  loader: { position: 'absolute', top: '50%', alignSelf: 'center' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { fontSize: fontSize.xxl, color: '#FFF', fontWeight: '300' },
});
