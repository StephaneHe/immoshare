import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '@/navigation/types';
import { pageService, Page } from '@/services/page.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PageList'>;

export function PageListScreen({ route, navigation }: Props) {
  const { propertyId } = route.params;
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      const data = await pageService.listForProperty(propertyId);
      setPages(data);
    } catch {
      Alert.alert('Error', 'Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPages();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Page', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await pageService.remove(id);
          setPages((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const renderPage = ({ item }: { item: Page }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PageDetail', { id: item.id })}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.pageTitle}>{item.title}</Text>
        <Text style={styles.pageMeta}>{item.locale} · {new Date(item.updatedAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        renderItem={renderPage}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No pages yet</Text>
            <Text style={styles.emptySubtitle}>Create a page to share this property</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardContent: { flex: 1 },
  pageTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  pageMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: fontSize.xl, color: colors.textLight },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, marginTop: spacing.xxl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
