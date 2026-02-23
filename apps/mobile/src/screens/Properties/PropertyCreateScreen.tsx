import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '@/navigation/types';
import { usePropertyStore } from '@/stores/property.store';
import { PropertyType, PROPERTY_TYPE_LABELS } from '@/types';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyCreate'>;

const PROPERTY_TYPES: PropertyType[] = [
  'apartment', 'house', 'penthouse', 'duplex', 'garden_apartment',
  'studio', 'villa', 'cottage', 'land', 'commercial', 'office', 'other',
];

export function PropertyCreateScreen({ navigation }: Props) {
  const { createProperty, isLoading } = usePropertyStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [parking, setParking] = useState('');
  const [elevator, setElevator] = useState(false);
  const [balcony, setBalcony] = useState(false);
  const [garden, setGarden] = useState(false);
  const [aircon, setAircon] = useState(false);
  const [furnished, setFurnished] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    const property = await createProperty({
      title: title.trim(),
      description: description.trim() || undefined,
      propertyType,
      price: price ? Number(price) : undefined,
      city: city.trim() || undefined,
      address: address.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      areaSqm: areaSqm ? Number(areaSqm) : undefined,
      rooms: rooms ? Number(rooms) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      floor: floor ? Number(floor) : undefined,
      totalFloors: totalFloors ? Number(totalFloors) : undefined,
      parking: parking ? Number(parking) : undefined,
      elevator,
      balcony,
      garden,
      aircon,
      furnished,
    });
    if (property) {
      navigation.replace('PropertyDetail', { id: property.id });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Type selector */}
      <Text style={styles.label}>Type *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        {PROPERTY_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, propertyType === t && styles.typeChipActive]}
            onPress={() => setPropertyType(t)}
          >
            <Text style={[styles.typeChipText, propertyType === t && styles.typeChipTextActive]}>
              {PROPERTY_TYPE_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Basic info */}
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Sunny 3BR in Ramat Aviv" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Property description..." multiline numberOfLines={4} />

      <Text style={styles.label}>Price (ILS)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g. 2500000" keyboardType="numeric" />

      {/* Location */}
      <Text style={styles.sectionHeader}>Location</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />
      <TextInput style={styles.input} value={neighborhood} onChangeText={setNeighborhood} placeholder="Neighborhood" />

      {/* Specs */}
      <Text style={styles.sectionHeader}>Specifications</Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Area (m²)</Text>
          <TextInput style={styles.input} value={areaSqm} onChangeText={setAreaSqm} keyboardType="numeric" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Rooms</Text>
          <TextInput style={styles.input} value={rooms} onChangeText={setRooms} keyboardType="numeric" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Bedrooms</Text>
          <TextInput style={styles.input} value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Bathrooms</Text>
          <TextInput style={styles.input} value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Floor</Text>
          <TextInput style={styles.input} value={floor} onChangeText={setFloor} keyboardType="numeric" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Total floors</Text>
          <TextInput style={styles.input} value={totalFloors} onChangeText={setTotalFloors} keyboardType="numeric" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.smallLabel}>Parking spots</Text>
          <TextInput style={styles.input} value={parking} onChangeText={setParking} keyboardType="numeric" />
        </View>
      </View>

      {/* Amenities toggles */}
      <Text style={styles.sectionHeader}>Amenities</Text>
      {[
        { label: 'Elevator', value: elevator, setter: setElevator },
        { label: 'Balcony', value: balcony, setter: setBalcony },
        { label: 'Garden', value: garden, setter: setGarden },
        { label: 'Air Conditioning', value: aircon, setter: setAircon },
        { label: 'Furnished', value: furnished, setter: setFurnished },
      ].map(({ label, value, setter }) => (
        <View key={label} style={styles.switchRow}>
          <Text style={styles.switchLabel}>{label}</Text>
          <Switch value={value} onValueChange={setter} trackColor={{ true: colors.primary }} />
        </View>
      ))}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, isLoading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitText}>{isLoading ? 'Creating...' : 'Create Property'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  smallLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 2 },
  sectionHeader: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeScroll: { marginBottom: spacing.sm },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs, backgroundColor: colors.surface },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  typeChipTextActive: { color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  halfField: { flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  switchLabel: { fontSize: fontSize.md, color: colors.text },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  btnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
});
