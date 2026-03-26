import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '@/navigation/types';
import { usePropertyStore } from '@/stores/property.store';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyList'>;

const STATUS_FILTERS: (PropertyStatus | 'all')[] = ['all', 'active', 'draft', 'under_offer', 'sold', 'rented', 'archived'];

export function PropertyListScreen({ navigation }: Props) {
  const { properties, total, isLoading, error, fetchProperties, fetchNextPage, clearError } = usePropertyStore();
  const [activeFilter, setActiveFilter] = useState<PropertyStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilter = useCallback((filter: PropertyStatus | 'all') => {
    setActiveFilter(filter);
    fetchProperties(filter === 'all' ? { status: undefined } : { status: filter });
  }, [fetchProperties]);

  const handleSearch = useCallback(() => {
    fetchProperties({
      search: searchText || undefined,
      status: activeFilter === 'all' ? undefined : activeFilter,
    });
  }, [fetchProperties, searchText, activeFilter]);

  const handleRefresh = useCallback(() => {
    fetchProperties({
      status: activeFilter === 'all' ? undefined : activeFilter,
      search: searchText || undefined,
    });
  }, [fetchProperties, activeFilter, searchText]);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          placeholderTextColor={colors.textLight}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Status filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isActive = item === activeFilter;
          const chipColor = item === 'all' ? colors.primary : STATUS_COLORS[item];
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                isActive && { backgroundColor: chipColor + '20', borderColor: chipColor },
              ]}
              onPress={() => handleFilter(item)}
            >
              <Text style={[styles.chipText, isActive && { color: chipColor, fontWeight: '600' }]}>
                {item === 'all' ? 'All' : STATUS_LABELS[item]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Error banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorText}>{error} — tap to dismiss</Text>
        </TouchableOpacity>
      )}

      {/* Property list */}
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.3}
        contentContainerStyle={properties.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          <Text style={styles.resultCount}>{total} {total === 1 ? 'property' : 'properties'}</Text>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>No properties yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to create your first listing</Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PropertyCreate')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  errorBanner: { backgroundColor: colors.errorLight, padding: spacing.sm, marginHorizontal: spacing.md, borderRadius: borderRadius.md },
  errorText: { color: colors.error, fontSize: fontSize.sm, textAlign: 'center' },
  resultCount: { fontSize: fontSize.sm, color: colors.textSecondary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  listContent: { paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, lineHeight: 30, fontWeight: '300' },
});
