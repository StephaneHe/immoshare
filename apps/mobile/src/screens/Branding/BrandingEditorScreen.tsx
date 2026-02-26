import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useBrandingStore } from '@/stores/branding.store';
import { UpdateBrandingData } from '@/services/branding.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

export function BrandingEditorScreen() {
  const { branding, isLoading, error, fetchBranding, updateBranding } = useBrandingStore();
  const [form, setForm] = useState<UpdateBrandingData>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchBranding(); }, [fetchBranding]);
  useEffect(() => {
    if (branding) {
      setForm({
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        fontFamily: branding.fontFamily ?? '',
        tagline: branding.tagline ?? '',
      });
    }
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBranding(form);
      Alert.alert('Success', 'Branding updated');
    } catch {
      Alert.alert('Error', 'Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !branding) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  }

  return (
    <ScrollView style={styles.container}>
      {error && <Text style={styles.errorBanner}>{error}</Text>}

      {/* Logo section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logo</Text>
        <View style={styles.logoPlaceholder}>
          {branding?.logoUrl ? (
            <Text style={styles.logoText}>Logo uploaded ✓</Text>
          ) : (
            <Text style={styles.logoText}>No logo uploaded</Text>
          )}
        </View>
      </View>

      {/* Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Colors</Text>
        <View style={styles.colorRow}>
          <View style={styles.colorInput}>
            <Text style={styles.inputLabel}>Primary Color</Text>
            <View style={styles.colorPreview}>
              <View style={[styles.colorSwatch, { backgroundColor: form.primaryColor || '#000' }]} />
              <TextInput
                style={styles.input}
                value={form.primaryColor}
                onChangeText={(v) => setForm((p) => ({ ...p, primaryColor: v }))}
                placeholder="#2563EB"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
          <View style={styles.colorInput}>
            <Text style={styles.inputLabel}>Accent Color</Text>
            <View style={styles.colorPreview}>
              <View style={[styles.colorSwatch, { backgroundColor: form.accentColor || '#000' }]} />
              <TextInput
                style={styles.input}
                value={form.accentColor}
                onChangeText={(v) => setForm((p) => ({ ...p, accentColor: v }))}
                placeholder="#059669"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Typography */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Typography</Text>
        <Text style={styles.inputLabel}>Font Family</Text>
        <TextInput
          style={styles.input}
          value={form.fontFamily}
          onChangeText={(v) => setForm((p) => ({ ...p, fontFamily: v }))}
          placeholder="Inter, Helvetica, Arial"
          placeholderTextColor={colors.textLight}
        />
      </View>

      {/* Tagline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tagline</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.tagline}
          onChangeText={(v) => setForm((p) => ({ ...p, tagline: v }))}
          placeholder="Your professional tagline..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Branding</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  errorBanner: { margin: spacing.md, padding: spacing.sm, backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.sm, textAlign: 'center' },
  section: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  logoPlaceholder: { height: 80, backgroundColor: colors.background, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  logoText: { color: colors.textSecondary, fontSize: fontSize.sm },
  colorRow: { flexDirection: 'row', gap: spacing.md },
  colorInput: { flex: 1 },
  colorPreview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  colorSwatch: { width: 32, height: 32, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border },
  inputLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  input: { padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md, color: colors.text },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  saveButton: { margin: spacing.md, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
});
