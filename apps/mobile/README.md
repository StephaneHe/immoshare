# ImmoShare Mobile

React Native (Expo) mobile application for Israeli real estate agents.

## Architecture

```
src/
├── navigation/          # React Navigation (bottom tabs + stacks)
│   ├── RootNavigator.tsx
│   ├── MainTabs.tsx     # 4 tab stacks, 22 screens
│   └── types.ts         # Navigation param types
├── screens/             # 22 screens organized by module
│   ├── Auth/            # Login, Register, ForgotPassword
│   ├── Properties/      # List, Detail, Create, Edit
│   ├── Pages/           # PageList, PageDetail
│   ├── Share/           # ContactList, ContactDetail, ShareCreate, ShareHistory
│   ├── Tracking/        # TrackingDashboard
│   ├── Notifications/   # NotificationList, NotificationSettings
│   ├── Profile/         # ProfileHome, AgencyManage, AgencyMembers, PartnerList, Settings
│   └── Branding/        # BrandingEditor
├── services/            # 10 API service modules
│   ├── api.ts           # Axios client with JWT refresh
│   ├── property.service.ts
│   ├── page.service.ts
│   ├── contact.service.ts
│   ├── share.service.ts
│   ├── tracking.service.ts
│   ├── partner.service.ts
│   ├── notification.service.ts
│   ├── branding.service.ts
│   └── agency.service.ts
├── stores/              # 7 Zustand stores
│   ├── auth.store.ts
│   ├── property.store.ts
│   ├── contact.store.ts
│   ├── tracking.store.ts
│   ├── partner.store.ts
│   ├── notification.store.ts
│   └── branding.store.ts
├── components/          # Reusable components
│   └── PropertyCard.tsx
├── theme/               # Design tokens (colors, spacing, typography)
│   └── tokens.ts
└── types/               # TypeScript type definitions
    └── property.ts
```

## Navigation Structure

```
BottomTabs
├── PropertiesTab (Stack)
│   ├── PropertyList (root)
│   ├── PropertyDetail
│   ├── PropertyCreate
│   ├── PropertyEdit
│   ├── PageList
│   └── PageDetail
├── ShareTab (Stack)
│   ├── ContactList (root)
│   ├── ContactDetail
│   ├── ShareCreate
│   ├── ShareHistory
│   └── TrackingDashboard
├── NotificationsTab (Stack)
│   ├── NotificationList (root)
│   └── NotificationSettings
└── ProfileTab (Stack)
    ├── ProfileHome (root)
    ├── AgencyManage
    ├── AgencyMembers
    ├── PartnerList
    ├── BrandingEditor
    └── Settings
```

## Testing

```bash
# Run all tests (224 tests, 25 suites)
npx jest

# Watch mode
npx jest --watch

# Single suite
npx jest --testPathPattern='BrandingEditor'

# Coverage
npx jest --coverage
```

## Design Tokens

| Token | Values |
|-------|--------|
| Primary | `#2563EB` (blue) |
| Surface | `#FFFFFF` |
| Background | `#F9FAFB` |
| Text | `#111827` |
| Error | `#DC2626` |
| Success | `#059669` |
| Spacing | xs=4, sm=8, md=16, lg=24, xl=32 |
| Font sizes | xs=12, sm=14, md=16, lg=18, xl=20, xxl=24, xxxl=30 |
| Radius | sm=4, md=8, lg=12, xl=16, full=9999 |
