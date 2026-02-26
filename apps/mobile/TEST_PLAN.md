# ImmoShare Mobile — Test Plan

> Organized by backend module (M1–M9), matching the architecture in PROGRESS.md.  
> Each section covers: **Store** (business logic), **Service** (API calls), **Screen** (UI rendering + interaction), **Navigation** (screen transitions).  
> Status: 🔴 = not started, 🟡 = partial, 🟢 = done

---

## Infrastructure — API Client & Navigation Shell

### API Client (`services/api.ts`)
| # | Test | Status |
|---|------|--------|
| I-01 | `init()` loads tokens from SecureStore | 🟢 |
| I-02 | `setTokens()` persists to SecureStore | 🟢 |
| I-03 | `clearTokens()` removes from SecureStore | 🟢 |
| I-04 | Successful request unwraps `{ success, data }` envelope | 🟢 |
| I-05 | Failed request throws ApiError with code + message | 🟢 |
| I-06 | 401 triggers token refresh then retries | 🟢 |
| I-07 | Failed refresh clears tokens and throws SESSION_EXPIRED | 🟢 |
| I-08 | Authorization header attached when token present | 🟢 |
| I-09 | `skipAuth` option skips Authorization header | 🟢 |
| I-10 | Convenience methods (get/post/put/patch/delete) call request | 🟢 |

### Root Navigation (`navigation/RootNavigator.tsx`)
| # | Test | Status |
|---|------|--------|
| I-11 | Shows loading spinner while `isLoading` is true | 🟢 |
| I-12 | Shows AuthStack when not authenticated | 🟢 |
| I-13 | Shows MainTabs when authenticated | 🟢 |

### MainTabs (`navigation/MainTabs.tsx`)
| # | Test | Status |
|---|------|--------|
| I-14 | Renders 4 bottom tabs: Properties, Share, Notifications, Profile | 🔴 |

---

## M1 — Auth (Backend: 76 tests, 8 endpoints)

### Auth Store (`stores/auth.store.ts`)
| # | Test | Status |
|---|------|--------|
| M1-01 | Initial state: user=null, isLoading=true, isAuthenticated=false | 🟢 |
| M1-02 | `init()` with valid token → fetches user, sets authenticated | 🟢 |
| M1-03 | `init()` with no token → sets isLoading=false | 🟢 |
| M1-04 | `init()` with expired token → clears tokens, not authenticated | 🟢 |
| M1-05 | `login()` success → stores tokens + user, isAuthenticated=true | 🟢 |
| M1-06 | `login()` failure → sets error message, isAuthenticated=false | 🟢 |
| M1-07 | `register()` success → stores tokens + user, isAuthenticated=true | 🟢 |
| M1-08 | `register()` combines firstName+lastName into `name` | 🟢 |
| M1-09 | `register()` sends role='agent' by default | 🟢 |
| M1-10 | `register()` failure → sets error message | 🟢 |
| M1-11 | `logout()` clears tokens + user, isAuthenticated=false | 🟢 |
| M1-12 | `logout()` ignores API errors (silent) | 🟢 |
| M1-13 | `clearError()` resets error to null | 🟢 |

### LoginScreen (`screens/Auth/LoginScreen.tsx`)
| # | Test | Status |
|---|------|--------|
| M1-14 | Renders title "ImmoShare" and subtitle | 🟢 |
| M1-15 | Renders email and password fields | 🟢 |
| M1-16 | Renders "Sign In" button | 🟢 |
| M1-17 | Sign In button disabled while loading | 🟢 |
| M1-18 | Tap Sign In calls login(email, password) | 🟢 |
| M1-19 | Displays error message on login failure | 🟢 |
| M1-20 | Typing in fields clears error | 🟢 |
| M1-21 | Tap "Sign Up" navigates to Register screen | 🟢 |
| M1-22 | Tap "Forgot password?" navigates to ForgotPassword screen | 🟢 |

### RegisterScreen (`screens/Auth/RegisterScreen.tsx`)
| # | Test | Status |
|---|------|--------|
| M1-23 | Renders "Create Account" title | 🟢 |
| M1-24 | Renders first name, last name, email, password fields | 🟢 |
| M1-25 | Create Account button disabled when fields empty | 🟢 |
| M1-26 | Create Account button disabled while loading | 🟢 |
| M1-27 | Tap Create Account calls register({ firstName, lastName, email, password }) | 🟢 |
| M1-28 | Displays error message on registration failure | 🟢 |
| M1-29 | Tap "Sign In" navigates back to Login screen | 🟢 |

### ForgotPasswordScreen (`screens/Auth/ForgotPasswordScreen.tsx`)
| # | Test | Status |
|---|------|--------|
| M1-30 | Renders "Reset Password" title | 🟢 |
| M1-31 | Renders email field and "Send Reset Link" button | 🟢 |
| M1-32 | Tap "Send Reset Link" triggers reset API call | 🟢 |
| M1-33 | Shows success confirmation after sending | 🟢 |
| M1-34 | Tap "Back to Sign In" navigates to Login | 🟢 |

---

## M2 — Agencies (Backend: 52 tests, 14 endpoints)

> Mobile: Not yet implemented (ProfileHomeScreen has menu items for AgencyManage, AgencyMembers)

### Agency Store (to create: `stores/agency.store.ts`)
| # | Test | Status |
|---|------|--------|
| M2-01 | Fetch current user's agency | 🟢 |
| M2-02 | List agency members | 🟢 |
| M2-03 | Create agency invitation | 🟢 |
| M2-04 | Accept/decline agency invite | 🟢 |
| M2-05 | Leave agency | 🟢 |

### AgencyManageScreen (placeholder → to implement)
| # | Test | Status |
|---|------|--------|
| M2-06 | Renders agency info (name, logo) | 🔴 |
| M2-07 | Shows member count | 🔴 |
| M2-08 | Navigate to members list | 🔴 |
| M2-09 | Invite new member form | 🔴 |

---

## M3 — Properties (Backend: 38 tests, 8 endpoints)

### Property Service (`services/property.service.ts`)
| # | Test | Status |
|---|------|--------|
| M3-01 | `getProperties()` calls GET /properties with pagination params | 🟢 |
| M3-02 | `getProperties()` applies filters (status, type, city, etc.) | 🟢 |
| M3-03 | `getProperty(id)` calls GET /properties/:id | 🟢 |
| M3-04 | `createProperty(data)` calls POST /properties | 🟢 |
| M3-05 | `updateProperty(id, data)` calls PUT /properties/:id | 🟢 |
| M3-06 | `deleteProperty(id)` calls DELETE /properties/:id | 🟢 |
| M3-07 | `duplicateProperty(id)` calls POST /properties/:id/duplicate | 🟢 |
| M3-08 | `updateStatus(id, status)` calls PATCH /properties/:id/status | 🟢 |

### Property Store (`stores/property.store.ts`)
| # | Test | Status |
|---|------|--------|
| M3-09 | Initial state: empty properties, total=0 | 🟢 |
| M3-10 | `fetchProperties()` populates list and total | 🟢 |
| M3-11 | `fetchProperties()` with search term filters results | 🟢 |
| M3-12 | `fetchProperties()` with status filter | 🟢 |
| M3-13 | `fetchNextPage()` appends to existing list | 🟢 |
| M3-14 | `fetchNextPage()` stops when all loaded | 🟢 |
| M3-15 | `setSearch()` triggers debounced fetch | 🔴 |
| M3-16 | Error state set on API failure | 🟢 |

### PropertyListScreen (`screens/Properties/PropertyListScreen.tsx`)
| # | Test | Status |
|---|------|--------|
| M3-17 | Renders search input | 🟢 |
| M3-18 | Renders status filter chips | 🟢 |
| M3-19 | Shows empty state "No properties yet" when list empty | 🟢 |
| M3-20 | Renders PropertyCard for each property | 🟢 |
| M3-21 | Pull-to-refresh triggers fetchProperties | 🔴 |
| M3-22 | Scroll to bottom triggers fetchNextPage | 🔴 |
| M3-23 | FAB (+) navigates to PropertyCreate | 🟢 |
| M3-24 | Tap PropertyCard navigates to PropertyDetail | 🟢 |
| M3-25 | Shows result count ("N properties") | 🟢 |
| M3-26 | Shows error banner on API failure | 🟢 |

### PropertyCard (`components/PropertyCard.tsx`)
| # | Test | Status |
|---|------|--------|
| M3-27 | Renders property title | 🟢 |
| M3-28 | Renders property address/city | 🟢 |
| M3-29 | Renders price formatted | 🟢 |
| M3-30 | Renders status badge with correct color | 🟢 |
| M3-31 | Renders property type icon | 🟢 |
| M3-32 | Tap calls onPress callback | 🟢 |

### PropertyDetailScreen (`screens/Properties/PropertyDetailScreen.tsx`)
| # | Test | Status |
|---|------|--------|
| M3-33 | Fetches property by ID on mount | 🟢 |
| M3-34 | Renders all property fields | 🟢 |
| M3-35 | Shows loading state while fetching | 🟢 |
| M3-36 | Shows error on fetch failure | 🟢 |
| M3-37 | Status change action available | 🟢 |
| M3-38 | Navigate to edit screen | 🟢 |

### PropertyCreateScreen (`screens/Properties/PropertyCreateScreen.tsx`)
| # | Test | Status |
|---|------|--------|
| M3-39 | Renders form with all required fields | 🟢 |
| M3-40 | Submit calls createProperty with form data | 🟢 |
| M3-41 | Validation errors displayed | 🟢 |
| M3-42 | Success navigates back to list | 🟢 |
| M3-43 | Cancel navigates back without saving | 🟢 |

---

## M4 — Pages (Backend: 41 tests, 6 endpoints)

> Mobile: Not yet implemented (types defined in navigation: PageList, PageDetail)

### Page Store (to create: `stores/page.store.ts`)
| # | Test | Status |
|---|------|--------|
| M4-01 | List pages for a property | 🟢 |
| M4-02 | Get page detail | 🟢 |
| M4-03 | Create page for property | 🟢 |
| M4-04 | Update page sections | 🟢 |
| M4-05 | Delete page | 🟢 |
| M4-06 | Preview page (HTML) | 🟢 |

### PageListScreen (to implement)
| # | Test | Status |
|---|------|--------|
| M4-07 | Lists pages for given property | 🔴 |
| M4-08 | Create new page button | 🔴 |
| M4-09 | Navigate to page detail | 🔴 |

---

## M5 — Sharing (Backend: 50 tests, 11 endpoints)

> Mobile: ContactListScreen is placeholder, TrackingDashboardScreen is placeholder

### Contact Store (to create: `stores/contact.store.ts`)
| # | Test | Status |
|---|------|--------|
| M5-01 | List contacts with pagination | 🟢 |
| M5-02 | Create contact (email or phone required) | 🟢 |
| M5-03 | Update contact | 🟢 |
| M5-04 | Delete contact | 🟢 |
| M5-05 | Search contacts by name | 🟢 |

### Share Store (to create: `stores/share.store.ts`)
| # | Test | Status |
|---|------|--------|
| M5-06 | Create share batch (contacts × channels) | 🟢 |
| M5-07 | List share links for property | 🟢 |
| M5-08 | Deactivate share link | 🟢 |
| M5-09 | Get share link detail with events | 🟢 |

### ContactListScreen (placeholder → to implement)
| # | Test | Status |
|---|------|--------|
| M5-10 | Renders contact list | 🟢 |
| M5-11 | Add contact form | 🔴 |
| M5-12 | Edit contact inline | 🔴 |
| M5-13 | Delete contact with confirmation | 🔴 |
| M5-14 | Search/filter contacts | 🟢 |

### ShareCreateScreen (to implement)
| # | Test | Status |
|---|------|--------|
| M5-15 | Select contacts for sharing | 🔴 |
| M5-16 | Select channels (WhatsApp, Email, SMS) | 🔴 |
| M5-17 | Set expiration | 🔴 |
| M5-18 | Submit creates batch | 🔴 |
| M5-19 | Shows results (success/warnings) | 🔴 |

---

## M6 — Tracking (Backend: 33 tests, 5 endpoints)

> Mobile: TrackingDashboardScreen is placeholder

### Tracking Store (to create: `stores/tracking.store.ts`)
| # | Test | Status |
|---|------|--------|
| M6-01 | Fetch property analytics | 🟢 |
| M6-02 | Fetch global dashboard | 🟢 |
| M6-03 | Period filter (7d, 30d, 90d) | 🟢 |

### TrackingDashboardScreen (placeholder → to implement)
| # | Test | Status |
|---|------|--------|
| M6-04 | Renders dashboard stats (opens, unique visitors) | 🟢 |
| M6-05 | Shows top properties by opens | 🟢 |
| M6-06 | Shows recent activity feed | 🟢 |
| M6-07 | Period selector works | 🟢 |

---

## M7 — Partners (Backend: 34 tests, 14 endpoints)

> Mobile: Not yet implemented (ProfileHomeScreen has "Partners" menu)

### Partner Store (to create: `stores/partner.store.ts`)
| # | Test | Status |
|---|------|--------|
| M7-01 | List active partners | 🟢 |
| M7-02 | Create partner invite (generates code) | 🟢 |
| M7-03 | Accept invite by code | 🟢 |
| M7-04 | Revoke partner (cascade) | 🟢 |
| M7-05 | List partner's catalog | 🟢 |
| M7-06 | Request reshare | 🟢 |
| M7-07 | Approve/reject reshare | 🟢 |

### PartnerListScreen (to implement)
| # | Test | Status |
|---|------|--------|
| M7-08 | Renders partner list | 🔴 |
| M7-09 | Invite partner button shows code | 🔴 |
| M7-10 | Accept invite by entering code | 🔴 |
| M7-11 | Revoke partner with confirmation | 🔴 |
| M7-12 | View partner catalog | 🔴 |

---

## M8 — Notifications (Backend: 25 tests, 9 endpoints)

> Mobile: NotificationListScreen is placeholder

### Notification Store (to create: `stores/notification.store.ts`)
| # | Test | Status |
|---|------|--------|
| M8-01 | List notifications with pagination | 🟢 |
| M8-02 | Unread count | 🟢 |
| M8-03 | Mark as read | 🟢 |
| M8-04 | Mark all as read | 🟢 |
| M8-05 | Delete notification | 🟢 |
| M8-06 | Get/update notification settings | 🟢 |
| M8-07 | Register push token | 🟢 |

### NotificationListScreen (placeholder → to implement)
| # | Test | Status |
|---|------|--------|
| M8-08 | Renders notification list | 🟢 |
| M8-09 | Unread badge on tab | 🔴 |
| M8-10 | Tap marks as read | 🔴 |
| M8-11 | "Mark all read" button | 🔴 |
| M8-12 | Swipe to delete | 🔴 |
| M8-13 | Navigate to notification settings | 🟢 |

---

## M9 — Branding (Backend: 27 tests, 7 endpoints)

> Mobile: BrandingEditorScreen is placeholder

### Branding Store (to create: `stores/branding.store.ts`)
| # | Test | Status |
|---|------|--------|
| M9-01 | Fetch current branding | 🟢 |
| M9-02 | Update branding (colors, fonts, tagline) | 🟢 |
| M9-03 | Upload logo | 🟢 |
| M9-04 | Upload photo | 🟢 |
| M9-05 | Delete logo | 🟢 |
| M9-06 | Preview branding | 🟢 |

### BrandingEditorScreen (placeholder → to implement)
| # | Test | Status |
|---|------|--------|
| M9-07 | Renders current branding preview | 🟢 |
| M9-08 | Color picker for primary/accent | 🟢 |
| M9-09 | Logo upload via image picker | 🔴 |
| M9-10 | Save updates branding | 🟢 |
| M9-11 | Preview button shows rendered page | 🔴 |

---

## Summary

| Module | Store Tests | Screen Tests | Total | Status |
|--------|------------|-------------|-------|--------|
| Infra  | 10         | 4           | 14    | 🟢     |
| M1 Auth | 13        | 21          | 34    | 🟢     |
| M2 Agencies | 5     | 4           | 9     | 🟡     |
| M3 Properties | 16  | 27          | 43    | 🟢     |
| M4 Pages | 6        | 3           | 9     | 🟡     |
| M5 Sharing | 14     | 10          | 24    | 🟡     |
| M6 Tracking | 3     | 4           | 7     | 🟡     |
| M7 Partners | 7     | 5           | 12    | 🟡     |
| M8 Notifications | 7 | 6          | 13    | 🟡     |
| M9 Branding | 6     | 5           | 11    | 🟡     |
| **TOTAL** | **87** | **89** | **176** | 🟡 |

### Priority Order (based on implementation status)
1. **Infra + M1** — API client + Auth (fully implemented, most critical)
2. **M3** — Properties (fully implemented)
3. **M5** — Sharing (partially implemented)
4. **M8** — Notifications (placeholder)
5. **M6** — Tracking (placeholder)
6. **M2** — Agencies (placeholder)
7. **M7** — Partners (placeholder)
8. **M4** — Pages (placeholder)
9. **M9** — Branding (placeholder)
