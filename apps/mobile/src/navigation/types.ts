export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  PropertiesTab: undefined;
  ShareTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type PropertiesStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: string };
  PropertyCreate: undefined;
  PropertyEdit: { id: string };
  PageList: { propertyId: string };
  PageDetail: { id: string };
};

export type ShareStackParamList = {
  ContactList: undefined;
  ContactDetail: { id: string };
  ShareCreate: { pageId?: string };
  ShareHistory: undefined;
  TrackingDashboard: undefined;
};

export type NotificationsStackParamList = {
  NotificationList: undefined;
  NotificationSettings: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  AgencyManage: undefined;
  AgencyMembers: undefined;
  PartnerList: undefined;
  BrandingEditor: undefined;
  Settings: undefined;
};
