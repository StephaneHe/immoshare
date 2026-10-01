# ImmoShare — API reference

Base URL: `http://<api-host>:3000`. All routes return the envelope `{ success, data }` / `{ success: false, error: { code, message } }`. Service version: `GET /api/version`; health: `GET /health`.


## Auth (M1) — 8 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login → tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| POST | `/api/v1/auth/verify-email` | No | Verify email token |
| POST | `/api/v1/auth/forgot-password` | No | Request password reset |
| POST | `/api/v1/auth/reset-password` | No | Reset password |
| POST | `/api/v1/auth/logout` | Yes | Revoke refresh token |
| POST | `/api/v1/auth/change-password` | Yes | Change password |

> **Note:** `GET /api/v1/auth/me` has been implemented (returns authenticated user profile).

## Agencies (M2) — 14 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/agencies` | Yes | Create agency |
| GET | `/api/v1/agencies/:id` | Yes | Get agency |
| PATCH | `/api/v1/agencies/:id` | Yes | Update agency |
| DELETE | `/api/v1/agencies/:id` | Yes | Delete agency |
| GET | `/api/v1/agencies/:id/members` | Yes | List members |
| DELETE | `/api/v1/agencies/:id/members/:userId` | Yes | Remove member |
| POST | `/api/v1/agencies/:id/leave` | Yes | Leave agency |
| POST | `/api/v1/agencies/:id/transfer-admin` | Yes | Transfer admin role |
| POST | `/api/v1/agency-invites` | Yes | Create invite |
| GET | `/api/v1/agency-invites` | Yes | List agency invites |
| DELETE | `/api/v1/agency-invites/:id` | Yes | Revoke invite |
| POST | `/api/v1/agency-invites/:code/accept` | Yes | Accept invite |
| POST | `/api/v1/agency-invites/:code/decline` | Yes | Decline invite |
| GET | `/api/v1/my-invites` | Yes | List user's invites |

## Properties (M3) — 8 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/properties` | Yes | Create property |
| GET | `/api/v1/properties` | Yes | List (paginated, 10 filters) |
| GET | `/api/v1/properties/:id` | Yes | Get by ID |
| PATCH | `/api/v1/properties/:id` | Yes | Update property |
| DELETE | `/api/v1/properties/:id` | Yes | Delete property |
| POST | `/api/v1/properties/:id/duplicate` | Yes | Duplicate as draft |
| PATCH | `/api/v1/properties/:id/status` | Yes | Change status |
| GET | `/api/v1/agencies/:id/properties` | Yes | Agency property list |

## Pages (M4) — 6 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/properties/:id/pages` | Yes | Create page |
| GET | `/api/v1/properties/:id/pages` | Yes | List property pages |
| GET | `/api/v1/pages/:id` | Yes | Get page |
| PATCH | `/api/v1/pages/:id` | Yes | Update page |
| DELETE | `/api/v1/pages/:id` | Yes | Delete page |
| GET | `/api/v1/pages/:id/preview` | Yes | Preview (watermarked) |

## Contacts (M5) — 5 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/contacts` | Yes | Create contact |
| GET | `/api/v1/contacts` | Yes | List (paginated) |
| GET | `/api/v1/contacts/:id` | Yes | Get contact |
| PATCH | `/api/v1/contacts/:id` | Yes | Update contact |
| DELETE | `/api/v1/contacts/:id` | Yes | Delete contact |

## Sharing (M5) — 6 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/share` | Yes | Batch share (contacts × channels) |
| GET | `/api/v1/share-links` | Yes | List share links (paginated) |
| GET | `/api/v1/share-links/:id` | Yes | Get share link |
| DELETE | `/api/v1/share-links/:id` | Yes | Deactivate link |
| GET | `/api/v1/v/:token` | No | Public page (HTML) |
| POST | `/api/v1/share-links/:id/delivery` | No | Delivery webhook |

## Tracking (M6) — 5 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/track/event` | No (token) | Record tracking event |
| POST | `/api/v1/track/heartbeat` | No (token) | Record time heartbeat |
| GET | `/api/v1/share-links/:id/events` | Yes | List events for a link |
| GET | `/api/v1/properties/:id/analytics` | Yes | Property analytics |
| GET | `/api/v1/analytics/dashboard` | Yes | Global dashboard |

## Partners (M7) — 12 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/partner-invites` | Yes | Generate invite code |
| GET | `/api/v1/partner-invites` | Yes | List my invites |
| DELETE | `/api/v1/partner-invites/:id` | Yes | Revoke invite |
| POST | `/api/v1/partner-invites/accept` | Yes | Accept invite code |
| GET | `/api/v1/partners` | Yes | List partners |
| DELETE | `/api/v1/partners/:inviteId` | Yes | Remove partner |
| GET | `/api/v1/partners/:inviteId/properties` | Yes | Partner property catalog |
| GET | `/api/v1/partners/:inviteId/properties/:id` | Yes | Partner property detail |
| POST | `/api/v1/reshare-requests` | Yes | Request reshare |
| GET | `/api/v1/reshare-requests` | Yes | List received reshares |
| GET | `/api/v1/reshare-requests/sent` | Yes | List sent reshares |
| POST | `/api/v1/reshare-requests/:id/approve` | Yes | Approve reshare |
| POST | `/api/v1/reshare-requests/:id/reject` | Yes | Reject reshare |

## Notifications (M8) — 9 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/v1/notifications` | Yes | List notifications |
| GET | `/api/v1/notifications/unread-count` | Yes | Unread count |
| PATCH | `/api/v1/notifications/:id/read` | Yes | Mark as read |
| POST | `/api/v1/notifications/read-all` | Yes | Mark all as read |
| DELETE | `/api/v1/notifications/:id` | Yes | Delete notification |
| GET | `/api/v1/notification-settings` | Yes | Get settings |
| PATCH | `/api/v1/notification-settings` | Yes | Update settings |
| POST | `/api/v1/push-tokens` | Yes | Register push token |
| DELETE | `/api/v1/push-tokens/:id` | Yes | Unregister push token |

## Branding (M9) — 10 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/v1/branding` | Yes | Get my branding |
| PUT | `/api/v1/branding` | Yes | Replace branding |
| PATCH | `/api/v1/branding` | Yes | Update branding |
| POST | `/api/v1/branding/logo` | Yes | Upload logo |
| DELETE | `/api/v1/branding/logo` | Yes | Delete logo |
| POST | `/api/v1/branding/photo` | Yes | Upload photo |
| DELETE | `/api/v1/branding/photo` | Yes | Delete photo |
| GET | `/api/v1/branding/preview` | Yes | Preview branding |
| GET | `/api/v1/agencies/:id/branding` | Yes | Get agency branding |
| PUT | `/api/v1/agencies/:id/branding` | Yes | Set agency branding |

