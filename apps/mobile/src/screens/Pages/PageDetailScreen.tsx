import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '@/navigation/types';
import { pageService, Page } from '@/services/page.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PageDetail'>;

export function PageDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    try {
      const data = await pageService.getById(id);
      setPage(data);
    } catch {
      Alert.alert('Error', 'Failed to load page');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  if (!page) return <Text style={styles.errorText}>Page not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.meta}>Locale: {page.locale}</Text>
        <Text style={styles.meta}>Updated: {new Date(page.updatedAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.sectionsCard}>
        <Text style={styles.sectionTitle}>Sections ({page.sections.length})</Text>
        {page.sections.length === 0 ? (
          <Text style={styles.emptyText}>No sections configured</Text>
        ) : (
          page.sections.map((section, i) => (
            <View key={i} style={styles.sectionItem}>
              <Text style={styles.sectionType}>{section.type}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  errorText: { padding: spacing.lg, color: colors.error, textAlign: 'center' },
  header: { padding: spacing.lg, backgroundColor: colors.surface },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  sectionsCard: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.sm },
  sectionItem: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionType: { fontSize: fontSize.md, color: colors.text, textTransform: 'capitalize' },
});
