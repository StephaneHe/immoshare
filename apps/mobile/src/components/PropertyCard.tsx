import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Property, PROPERTY_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = {
  property: Property;
  onPress: () => void;
};

export function PropertyCard({ property, onPress }: Props) {
  const statusColor = STATUS_COLORS[property.status];

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Price TBD';
    return new Intl.NumberFormat('en-IL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const details: string[] = [];
  if (property.rooms) details.push(`${property.rooms} rooms`);
  if (property.bedrooms) details.push(`${property.bedrooms} bed`);
  if (property.bathrooms) details.push(`${property.bathrooms} bath`);
  if (property.areaSqm) details.push(`${property.areaSqm}m²`);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.type}>{PROPERTY_TYPE_LABELS[property.propertyType]}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[property.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{property.title}</Text>

      {(property.city || property.address) && (
        <Text style={styles.location} numberOfLines={1}>
          📍 {[property.address, property.city].filter(Boolean).join(', ')}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.price}>
          {formatPrice(property.price, property.currency)}
        </Text>
        {details.length > 0 && (
          <Text style={styles.details}>{details.join(' · ')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  type: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  details: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
