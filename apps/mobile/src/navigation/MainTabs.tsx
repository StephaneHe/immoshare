import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, PropertiesStackParamList, ShareStackParamList, NotificationsStackParamList, ProfileStackParamList } from './types';
import { colors } from '@/theme';

// Screens — Properties
import { PropertyListScreen } from '@/screens/Properties/PropertyListScreen';
import { PropertyDetailScreen } from '@/screens/Properties/PropertyDetailScreen';

// Screens — Share
import { ContactListScreen } from '@/screens/Share/ContactListScreen';
import { TrackingDashboardScreen } from '@/screens/Tracking/TrackingDashboardScreen';

// Screens — Notifications
import { NotificationListScreen } from '@/screens/Notifications/NotificationListScreen';

// Screens — Profile
import { ProfileHomeScreen } from '@/screens/Profile/ProfileHomeScreen';
import { BrandingEditorScreen } from '@/screens/Branding/BrandingEditorScreen';

// --- Nested stacks ---

const PropertiesStack = createNativeStackNavigator<PropertiesStackParamList>();
function PropertiesNavigator() {
  return (
    <PropertiesStack.Navigator>
      <PropertiesStack.Screen name="PropertyList" component={PropertyListScreen} options={{ title: 'My Properties' }} />
      <PropertiesStack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property' }} />
    </PropertiesStack.Navigator>
  );
}

const ShareStack = createNativeStackNavigator<ShareStackParamList>();
function ShareNavigator() {
  return (
    <ShareStack.Navigator>
      <ShareStack.Screen name="ContactList" component={ContactListScreen} options={{ title: 'Contacts & Shares' }} />
      <ShareStack.Screen name="TrackingDashboard" component={TrackingDashboardScreen} options={{ title: 'Tracking' }} />
    </ShareStack.Navigator>
  );
}

const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
function NotificationsNavigator() {
  return (
    <NotificationsStack.Navigator>
      <NotificationsStack.Screen name="NotificationList" component={NotificationListScreen} options={{ title: 'Notifications' }} />
    </NotificationsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="BrandingEditor" component={BrandingEditorScreen} options={{ title: 'Branding' }} />
    </ProfileStack.Navigator>
  );
}

// --- Main Tabs ---

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      }}
    >
      <Tab.Screen
        name="PropertiesTab"
        component={PropertiesNavigator}
        options={{ title: 'Properties' }}
      />
      <Tab.Screen
        name="ShareTab"
        component={ShareNavigator}
        options={{ title: 'Share' }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsNavigator}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
