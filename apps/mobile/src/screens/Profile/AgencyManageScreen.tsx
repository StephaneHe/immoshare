import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/types';
import { agencyService, Agency } from '@/services/agency.service';
import { useAuthStore } from '@/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AgencyManage'>;

export function AgencyManageScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agencyName, setAgencyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchAgency = useCallback(async () => {
    if (!user?.agencyId) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await agencyService.getById(user.agencyId);
      setAgency(data);
    } catch {
      // No agency found
    } finally {
      setIsLoading(false);
    }
  }, [user?.agencyId]);

  useEffect(() => { fetchAgency(); }, [fetchAgency]);

  const handleCreate = async () => {
    if (!agencyName.trim()) {
      Alert.alert('Error', 'Please enter an agency name');
      return;
    }
    setIsCreating(true);
    try {
      const newAgency = await agencyService.create({ name: agencyName.trim() });
      setAgency(newAgency);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create agency');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  if (!agency) {
    return (
      <View style={styles.container}>
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Create Your Agency</Text>
          <Text style={styles.createSubtitle}>Set up an agency to manage team members and share properties.</Text>
          <TextInput
            style={styles.input}
            placeholder="Agency Name"
            value={agencyName}
            onChangeText={setAgencyName}
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Create Agency</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.agencyCard}>
        <Text style={styles.agencyName}>{agency.name}</Text>
        {agency.address && <Text style={styles.agencyDetail}>{agency.address}</Text>}
        {agency.phone && <Text style={styles.agencyDetail}>{agency.phone}</Text>}
        {agency.email && <Text style={styles.agencyDetail}>{agency.email}</Text>}
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('AgencyMembers')}
      >
        <Text style={styles.menuIcon}>👥</Text>
        <Text style={styles.menuLabel}>Team Members</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  createCard: { margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg },
  createTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  createSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  input: { padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.md },
  createButton: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
  agencyCard: { margin: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg },
  agencyName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  agencyDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon: { fontSize: 20, marginRight: spacing.md },
  menuLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
  menuArrow: { fontSize: fontSize.xl, color: colors.textLight },
});
