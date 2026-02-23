import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '@/navigation/types';
import { usePropertyStore } from '@/stores/property.store';
import { PROPERTY_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PropertyStatus } from '@/types';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyDetail'>;

const VALID_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  draft: ['active', 'archived'],
  active: ['under_offer', 'sold', 'rented', 'archived'],
  under_offer: ['active', 'sold', 'rented', 'archived'],
  sold: ['archived'],
  rented: ['active', 'archived'],
  archived: ['draft'],
};

export function PropertyDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { selectedProperty: property, isLoadingDetail, error, fetchPropertyById, changeStatus, removeProperty, duplicateProperty, clearSelectedProperty } = usePropertyStore();

  useEffect(() => {
    fetchPropertyById(id);
    return () => clearSelectedProperty();
  }, [id, fetchPropertyById, clearSelectedProperty]);

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Price TBD';
    return new Intl.NumberFormat('en-IL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  };

  const handleStatusChange = useCallback((newStatus: PropertyStatus) => {
    Alert.alert(
      'Change Status',
      `Set status to "${STATUS_LABELS[newStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => changeStatus(id, newStatus) },
      ],
    );
  }, [id, changeStatus]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Property',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await removeProperty(id);
            if (ok) navigation.goBack();
          },
        },
      ],
    );
  }, [id, removeProperty, navigation]);

  const handleDuplicate = useCallback(async () => {
    const dup = await duplicateProperty(id);
    if (dup) {
      navigation.replace('PropertyDetail', { id: dup.id });
    }
  }, [id, duplicateProperty, navigation]);

  if (isLoadingDetail || !property) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  const statusColor = STATUS_COLORS[property.status];
  const transitions = VALID_TRANSITIONS[property.status] || [];

  const features: { label: string; value: string }[] = [];
  if (property.rooms) features.push({ label: 'Rooms', value: String(property.rooms) });
  if (property.bedrooms) features.push({ label: 'Bedrooms', value: String(property.bedrooms) });
  if (property.bathrooms) features.push({ label: 'Bathrooms', value: String(property.bathrooms) });
  if (property.areaSqm) features.push({ label: 'Area', value: `${property.areaSqm}m²` });
  if (property.floor) features.push({ label: 'Floor', value: `${property.floor}/${property.totalFloors || '?'}` });
  if (property.yearBuilt) features.push({ label: 'Built', value: String(property.yearBuilt) });
  if (property.parking) features.push({ label: 'Parking', value: String(property.parking) });

  const amenities: string[] = [];
  if (property.elevator) amenities.push('Elevator');
  if (property.balcony) amenities.push('Balcony');
  if (property.garden) amenities.push('Garden');
  if (property.aircon) amenities.push('A/C');
  if (property.furnished) amenities.push('Furnished');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.typeContainer}>
            <Text style={styles.type}>{PROPERTY_TYPE_LABELS[property.propertyType]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{STATUS_LABELS[property.status]}</Text>
          </View>
        </View>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>{formatPrice(property.price, property.currency)}</Text>
        {(property.city || property.address) && (
          <Text style={styles.location}>📍 {[property.address, property.city].filter(Boolean).join(', ')}</Text>
        )}
      </View>

      {/* Description */}
      {property.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>
      )}

      {/* Features grid */}
      {features.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.featureGrid}>
            {features.map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <Text style={styles.featureValue}>{f.value}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesRow}>
            {amenities.map((a) => (
              <View key={a} style={styles.amenityChip}>
                <Text style={styles.amenityText}>✓ {a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          <View style={styles.transitionsRow}>
            {transitions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.transitionBtn, { borderColor: STATUS_COLORS[s] }]}
                onPress={() => handleStatusChange(s)}
              >
                <Text style={[styles.transitionText, { color: STATUS_COLORS[s] }]}>{STATUS_LABELS[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PropertyEdit', { id })}>
            <Text style={styles.actionText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDuplicate}>
            <Text style={styles.actionText}>📋 Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PageList', { propertyId: id })}>
            <Text style={styles.actionText}>📄 Pages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Text style={styles.deleteText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metadata */}
      <Text style={styles.metaText}>
        Created {new Date(property.createdAt).toLocaleDateString()} · Updated {new Date(property.updatedAt).toLocaleDateString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { color: colors.error, marginTop: spacing.md },
  headerCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  typeContainer: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  type: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', textTransform: 'uppercase' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusLabel: { fontSize: fontSize.xs, fontWeight: '600' },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  price: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  location: { fontSize: fontSize.md, color: colors.textSecondary },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureItem: { width: '30%', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.md },
  featureValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  featureLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  amenityChip: { backgroundColor: colors.successLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  amenityText: { fontSize: fontSize.sm, color: colors.success },
  transitionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  transitionBtn: { borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  transitionText: { fontSize: fontSize.sm, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBtn: { flex: 1, minWidth: '40%', backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  actionText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  deleteBtn: { backgroundColor: colors.errorLight },
  deleteText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.error },
  metaText: { fontSize: fontSize.xs, color: colors.textLight, textAlign: 'center', marginTop: spacing.sm },
});
