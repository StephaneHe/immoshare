import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PropertiesStackParamList } from '@/navigation/types';
import { usePropertyStore } from '@/stores/property.store';
import { propertyService } from '@/services/property.service';
import { Property, UpdatePropertyInput } from '@/types/property';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyEdit'>;

export function PropertyEditScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<UpdatePropertyInput>({});

  const fetchProperty = useCallback(async () => {
    try {
      const data = await propertyService.getById(id);
      setProperty(data);
      setForm({
        title: data.title,
        description: data.description ?? '',
        propertyType: data.propertyType,
        price: data.price ?? undefined,
        currency: data.currency,
        address: data.address ?? '',
        city: data.city ?? '',
        rooms: data.rooms ?? undefined,
        bedrooms: data.bedrooms ?? undefined,
        bathrooms: data.bathrooms ?? undefined,
        areaSqm: data.areaSqm ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await propertyService.update(id, form);
      Alert.alert('Success', 'Property updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  const setField = (key: keyof UpdatePropertyInput, value: string) => {
    const numericFields = ['price', 'rooms', 'bedrooms', 'bathrooms', 'areaSqm'];
    setForm((p) => ({
      ...p,
      [key]: numericFields.includes(key) ? (value ? Number(value) : undefined) : value,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setField('title', v)} placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={(v) => setField('description', v)} multiline numberOfLines={4} placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>Price</Text>
        <TextInput style={styles.input} value={form.price?.toString()} onChangeText={(v) => setField('price', v)} keyboardType="numeric" placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={form.address} onChangeText={(v) => setField('address', v)} placeholderTextColor={colors.textLight} />

        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={form.city} onChangeText={(v) => setField('city', v)} placeholderTextColor={colors.textLight} />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Rooms</Text>
            <TextInput style={styles.input} value={form.rooms?.toString()} onChangeText={(v) => setField('rooms', v)} keyboardType="numeric" placeholderTextColor={colors.textLight} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Bedrooms</Text>
            <TextInput style={styles.input} value={form.bedrooms?.toString()} onChangeText={(v) => setField('bedrooms', v)} keyboardType="numeric" placeholderTextColor={colors.textLight} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput style={styles.input} value={form.bathrooms?.toString()} onChangeText={(v) => setField('bathrooms', v)} keyboardType="numeric" placeholderTextColor={colors.textLight} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Area (sqm)</Text>
            <TextInput style={styles.input} value={form.areaSqm?.toString()} onChangeText={(v) => setField('areaSqm', v)} keyboardType="numeric" placeholderTextColor={colors.textLight} />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  section: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md, color: colors.text },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  saveButton: { margin: spacing.md, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
});
