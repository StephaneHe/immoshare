import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MainTabParamList, PropertiesStackParamList, ShareStackParamList, NotificationsStackParamList, ProfileStackParamList } from './types';
import { colors } from '@/theme';

// Screens — Properties
import { PropertyListScreen } from '@/screens/Properties/PropertyListScreen';
import { PropertyDetailScreen } from '@/screens/Properties/PropertyDetailScreen';
import { PropertyCreateScreen } from '@/screens/Properties/PropertyCreateScreen';
import { PropertyEditScreen } from '@/screens/Properties/PropertyEditScreen';

// Screens — Pages
import { PageListScreen } from '@/screens/Pages/PageListScreen';
import { PageDetailScreen } from '@/screens/Pages/PageDetailScreen';

// Screens — Share
import { ContactListScreen } from '@/screens/Share/ContactListScreen';
import { ContactDetailScreen } from '@/screens/Share/ContactDetailScreen';
import { ShareCreateScreen } from '@/screens/Share/ShareCreateScreen';
import { ShareHistoryScreen } from '@/screens/Share/ShareHistoryScreen';
import { TrackingDashboardScreen } from '@/screens/Tracking/TrackingDashboardScreen';

// Screens — Notifications
import { NotificationListScreen } from '@/screens/Notifications/NotificationListScreen';
import { NotificationSettingsScreen } from '@/screens/Notifications/NotificationSettingsScreen';

// Screens — Profile
import { ProfileHomeScreen } from '@/screens/Profile/ProfileHomeScreen';
import { AgencyManageScreen } from '@/screens/Profile/AgencyManageScreen';
import { AgencyMembersScreen } from '@/screens/Profile/AgencyMembersScreen';
import { PartnerListScreen } from '@/screens/Profile/PartnerListScreen';
import { BrandingEditorScreen } from '@/screens/Branding/BrandingEditorScreen';
import { SettingsScreen } from '@/screens/Profile/SettingsScreen';

// --- Nested stacks ---

const PropertiesStack = createNativeStackNavigator<PropertiesStackParamList>();
function PropertiesNavigator() {
  return (
    <PropertiesStack.Navigator>
      <PropertiesStack.Screen name="PropertyList" component={PropertyListScreen} options={{ title: 'My Properties' }} />
      <PropertiesStack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property' }} />
      <PropertiesStack.Screen name="PropertyCreate" component={PropertyCreateScreen} options={{ title: 'New Property' }} />
      <PropertiesStack.Screen name="PropertyEdit" component={PropertyEditScreen} options={{ title: 'Edit Property' }} />
      <PropertiesStack.Screen name="PageList" component={PageListScreen} options={{ title: 'Pages' }} />
      <PropertiesStack.Screen name="PageDetail" component={PageDetailScreen} options={{ title: 'Page Detail' }} />
    </PropertiesStack.Navigator>
  );
}

const ShareStack = createNativeStackNavigator<ShareStackParamList>();
function ShareNavigator() {
  return (
    <ShareStack.Navigator>
      <ShareStack.Screen name="ContactList" component={ContactListScreen} options={{ title: 'Contacts & Shares' }} />
      <ShareStack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ title: 'Contact' }} />
      <ShareStack.Screen name="ShareCreate" component={ShareCreateScreen} options={{ title: 'New Share' }} />
      <ShareStack.Screen name="ShareHistory" component={ShareHistoryScreen} options={{ title: 'Share History' }} />
      <ShareStack.Screen name="TrackingDashboard" component={TrackingDashboardScreen} options={{ title: 'Tracking' }} />
    </ShareStack.Navigator>
  );
}

const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
function NotificationsNavigator() {
  return (
    <NotificationsStack.Navigator>
      <NotificationsStack.Screen name="NotificationList" component={NotificationListScreen} options={{ title: 'Notifications' }} />
      <NotificationsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Settings' }} />
    </NotificationsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="AgencyManage" component={AgencyManageScreen} options={{ title: 'Agency' }} />
      <ProfileStack.Screen name="AgencyMembers" component={AgencyMembersScreen} options={{ title: 'Team' }} />
      <ProfileStack.Screen name="PartnerList" component={PartnerListScreen} options={{ title: 'Partners' }} />
      <ProfileStack.Screen name="BrandingEditor" component={BrandingEditorScreen} options={{ title: 'Branding' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </ProfileStack.Navigator>
  );
}

// --- Main Tabs ---

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'];
          switch (route.name) {
            case 'PropertiesTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ShareTab':
              iconName = focused ? 'share-social' : 'share-social-outline';
              break;
            case 'NotificationsTab':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
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
