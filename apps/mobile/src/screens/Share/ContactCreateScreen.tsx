import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShareStackParamList } from '@/navigation/types';
import { useContactStore } from '@/stores/contact.store';
import { CreateContactData } from '@/services/contact.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<ShareStackParamList, 'ContactCreate'>;

export function ContactCreateScreen({ navigation }: Props) {
  const { createContact } = useContactStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const data: CreateContactData = { name: name.trim() };
      if (email.trim()) data.email = email.trim();
      if (phone.trim()) data.phone = phone.trim();
      if (company.trim()) data.company = company.trim();
      if (notes.trim()) data.notes = notes.trim();
      await createContact(data);
      // The store prepends the new contact, so the list refreshes on the way back.
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        placeholderTextColor={colors.textLight}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={colors.textLight}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        placeholderTextColor={colors.textLight}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Company</Text>
      <TextInput
        style={styles.input}
        placeholder="Company"
        value={company}
        onChangeText={setCompany}
        placeholderTextColor={colors.textLight}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notes..."
        value={notes}
        onChangeText={setNotes}
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Add Contact</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  errorBox: { backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: fontSize.sm },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
});
