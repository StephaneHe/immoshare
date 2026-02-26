import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTrackingStore } from '@/stores/tracking.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

const PERIODS = [
  { key: '7d' as const, label: '7 days' },
  { key: '30d' as const, label: '30 days' },
  { key: '90d' as const, label: '90 days' },
];

export function TrackingDashboardScreen() {
  const { dashboard, isLoading, error, period, fetchDashboard, setPeriod } = useTrackingStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handlePeriodChange = (p: '7d' | '30d' | '90d') => {
    setPeriod(p);
    fetchDashboard({ period: p });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  if (isLoading && !dashboard) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            onPress={() => handlePeriodChange(p.key)}
          >
            <Text style={[styles.periodLabel, period === p.key && styles.periodLabelActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.errorBanner}>{error}</Text>}

      {dashboard && (
        <>
          {/* Stats cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard.stats.totalOpens}</Text>
              <Text style={styles.statLabel}>Total Opens</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard.stats.uniqueVisitors}</Text>
              <Text style={styles.statLabel}>Unique Visitors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard.stats.totalShares}</Text>
              <Text style={styles.statLabel}>Total Shares</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(dashboard.stats.avgOpenRate * 100)}%</Text>
              <Text style={styles.statLabel}>Open Rate</Text>
            </View>
          </View>

          {/* Top properties */}
          {dashboard.topProperties.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Properties</Text>
              {dashboard.topProperties.map((p, i) => (
                <View key={p.propertyId} style={styles.topRow}>
                  <Text style={styles.topRank}>#{i + 1}</Text>
                  <Text style={styles.topTitle} numberOfLines={1}>{p.propertyTitle}</Text>
                  <Text style={styles.topOpens}>{p.opens} opens</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recent activity */}
          {dashboard.recentActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {dashboard.recentActivity.slice(0, 10).map((a) => (
                <View key={a.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityType}>{a.type.replace(/_/g, ' ')}</Text>
                    {a.contactName && <Text style={styles.activityContact}>{a.contactName}</Text>}
                    <Text style={styles.activityDate}>
                      {new Date(a.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  periodRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  periodChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  periodChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  periodLabel: { fontSize: fontSize.sm, color: colors.text },
  periodLabelActive: { color: colors.primary, fontWeight: '600' },
  errorBanner: { margin: spacing.md, padding: spacing.sm, backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.sm, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm },
  statCard: { width: '50%', padding: spacing.sm },
  statValue: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  section: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  topRank: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary, width: 32 },
  topTitle: { flex: 1, fontSize: fontSize.md, color: colors.text },
  topOpens: { fontSize: fontSize.sm, color: colors.textSecondary },
  activityRow: { flexDirection: 'row', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6, marginRight: spacing.md },
  activityContent: { flex: 1 },
  activityType: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  activityContact: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  activityDate: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
});
