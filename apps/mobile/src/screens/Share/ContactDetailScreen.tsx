import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShareStackParamList } from '@/navigation/types';
import { contactService, Contact, UpdateContactData } from '@/services/contact.service';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<ShareStackParamList, 'ContactDetail'>;

export function ContactDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [contact, setContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<UpdateContactData>({});

  const fetchContact = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await contactService.getById(id);
      setContact(data);
      setForm({ name: data.name, email: data.email ?? '', phone: data.phone ?? '', company: data.company ?? '', notes: data.notes ?? '' });
    } catch {
      Alert.alert('Error', 'Failed to load contact');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  const handleSave = async () => {
    try {
      const updated = await contactService.update(id, form);
      setContact(updated);
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update contact');
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;
  if (!contact) return <Text style={styles.errorText}>Contact not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
        </View>
        {!isEditing ? (
          <>
            <Text style={styles.name}>{contact.name}</Text>
            {contact.email && <Text style={styles.info}>{contact.email}</Text>}
            {contact.phone && <Text style={styles.info}>{contact.phone}</Text>}
            {contact.company && <Text style={styles.company}>{contact.company}</Text>}
            {contact.notes && <Text style={styles.notes}>{contact.notes}</Text>}
          </>
        ) : (
          <View style={styles.form}>
            {(['name', 'email', 'phone', 'company', 'notes'] as const).map((field) => (
              <TextInput
                key={field}
                style={styles.input}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={(form as Record<string, string>)[field] ?? ''}
                onChangeText={(v) => setForm((p) => ({ ...p, [field]: v }))}
                placeholderTextColor={colors.textLight}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit Contact</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  errorText: { padding: spacing.lg, color: colors.error, textAlign: 'center' },
  header: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary },
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  info: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  company: { fontSize: fontSize.sm, color: colors.primary, marginTop: spacing.xs },
  notes: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  form: { width: '100%', marginTop: spacing.md },
  input: { padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, fontSize: fontSize.md, color: colors.text },
  actions: { padding: spacing.lg },
  editButton: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  editButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  cancelButton: { flex: 1, padding: spacing.md, backgroundColor: colors.border, borderRadius: borderRadius.md, alignItems: 'center' },
  cancelButtonText: { color: colors.text, fontSize: fontSize.md },
  saveButton: { flex: 1, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
});
