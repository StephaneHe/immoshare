import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

export function SettingsScreen() {
  const { logout } = useAuthStore();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Contact Support', 'Please contact support@immoshare.com to delete your account.');
        }},
      ]
    );
  };

  const settings = [
    { label: 'Privacy Policy', icon: '🔒', onPress: () => Linking.openURL('https://immoshare.com/privacy') },
    { label: 'Terms of Service', icon: '📄', onPress: () => Linking.openURL('https://immoshare.com/terms') },
    { label: 'Help & Support', icon: '❓', onPress: () => Linking.openURL('mailto:support@immoshare.com') },
    { label: 'App Version', icon: 'ℹ️', onPress: () => Alert.alert('Version', 'ImmoShare v1.0.0') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {settings.map((item) => (
          <TouchableOpacity key={item.label} style={styles.row} onPress={item.onPress}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { fontSize: 20, marginRight: spacing.md },
  label: { flex: 1, fontSize: fontSize.md, color: colors.text },
  arrow: { fontSize: fontSize.xl, color: colors.textLight },
  dangerZone: { margin: spacing.md, marginTop: spacing.lg },
  dangerTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.error, marginBottom: spacing.sm, textTransform: 'uppercase' },
  deleteButton: { padding: spacing.md, backgroundColor: colors.errorLight, borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing.sm },
  deleteText: { color: colors.error, fontWeight: '600' },
  logoutButton: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  logoutText: { color: colors.text, fontWeight: '600' },
});
