import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/auth.store';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProfileHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { label: 'Agency Management', screen: 'AgencyManage' as const, icon: '🏢' },
    { label: 'Partners', screen: 'PartnerList' as const, icon: '🤝' },
    { label: 'Branding', screen: 'BrandingEditor' as const, icon: '🎨' },
    { label: 'Settings', screen: 'Settings' as const, icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen as any)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  userCard: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  userName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  userEmail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  userRole: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', marginTop: spacing.xs, textTransform: 'uppercase' },
  menu: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { fontSize: 20, marginRight: spacing.md },
  menuLabel: { flex: 1, fontSize: fontSize.md, color: colors.text },
  menuArrow: { fontSize: fontSize.xl, color: colors.textLight },
  logoutButton: { marginTop: spacing.lg, padding: spacing.md, alignItems: 'center', backgroundColor: colors.errorLight, borderRadius: borderRadius.md },
  logoutText: { color: colors.error, fontSize: fontSize.md, fontWeight: '600' },
});
