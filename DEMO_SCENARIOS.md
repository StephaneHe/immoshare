# ImmoShare — Demo Scenarios

> Prerequisites: backend running on http://localhost:3000
> Start: `cd packages/api && npm run dev`
> Requires: `jq` installed

---

## Demo 1 — Full agent → client flow

### Step 1: Register agent
```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"sophie@demo.com","password":"Demo12345","name":"Sophie Martin","role":"agent"}' | jq .
```

### Step 2: Login (save token)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sophie@demo.com","password":"Demo12345"}' | jq -r .data.token)
echo "Token: $TOKEN"
```

### Step 3: Create property
```bash
PROP_ID=$(curl -s -X POST http://localhost:3000/api/v1/properties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Villa Bord de Mer","description":"5 pièces, terrasse, vue mer","price":850000,"address":"12 Promenade des Anglais, Nice","bedrooms":4,"bathrooms":2,"area":180}' \
  | jq -r .data.id)
echo "Property: $PROP_ID"
```

### Step 4: Create presentation page
```bash
PAGE_ID=$(curl -s -X POST http://localhost:3000/api/v1/properties/$PROP_ID/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Découvrez cette villa exceptionnelle"}' \
  | jq -r .data.id)
echo "Page: $PAGE_ID"
```

### Step 5: Add contact
```bash
CONTACT_ID=$(curl -s -X POST http://localhost:3000/api/v1/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jean Dupont","email":"client@demo.com","phone":"+33612345678"}' \
  | jq -r .data.id)
echo "Contact: $CONTACT_ID"
```

### Step 6: Share by email (real Brevo send)
```bash
curl -s -X POST http://localhost:3000/api/v1/pages/$PAGE_ID/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"recipients\": [{\"contactId\": \"$CONTACT_ID\", \"channels\": [\"email\"]}],
    \"expiresInDays\": 30,
    \"message\": \"Bonjour Jean, voici une villa qui pourrait vous intéresser !\"
  }" | jq .
```

### Step 7: View created share link
```bash
curl -s http://localhost:3000/api/v1/share-links \
  -H "Authorization: Bearer $TOKEN" | jq '.data.links[0]'
```

### Step 8: Simulate client visiting public page
```bash
LINK_TOKEN=$(curl -s http://localhost:3000/api/v1/share-links \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.links[0].token')

curl -s http://localhost:3000/api/v1/v/$LINK_TOKEN | jq .
```

### Step 9: Track page open event (as frontend would)
```bash
LINK_ID=$(curl -s http://localhost:3000/api/v1/share-links \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.links[0].id')

curl -s -X POST http://localhost:3000/api/v1/track/event \
  -H "Content-Type: application/json" \
  -d "{
    \"linkId\": \"$LINK_ID\",
    \"type\": \"page_opened\",
    \"meta\": {\"userAgent\": \"Mozilla/5.0\", \"referrer\": \"email\"}
  }" | jq .
```

### Step 10: View property analytics
```bash
curl -s http://localhost:3000/api/v1/properties/$PROP_ID/analytics \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Step 11: View analytics dashboard
```bash
curl -s http://localhost:3000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Demo 2 — Multi-channel share (email + WhatsApp stub)

```bash
curl -s -X POST http://localhost:3000/api/v1/pages/$PAGE_ID/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"recipients\": [
      {\"contactId\": \"$CONTACT_ID\", \"channels\": [\"email\", \"whatsapp\"]}
    ],
    \"expiresInDays\": 7,
    \"message\": \"Propriété disponible uniquement cette semaine !\"
  }" | jq .
# WhatsApp: logs to console (stub), email: sent via Brevo
```

---

## Demo 3 — Media upload

```bash
# Upload a photo to the property
curl -s -X POST "http://localhost:3000/api/v1/properties/$PROP_ID/media?type=photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/villa.jpg" | jq .

# List media
curl -s http://localhost:3000/api/v1/properties/$PROP_ID/media \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Demo 4 — Notifications

```bash
# List notifications
curl -s http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN" | jq .

# Unread count
curl -s http://localhost:3000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN" | jq .

# Configure quiet hours (no push at night)
curl -s -X PATCH http://localhost:3000/api/v1/notification-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quietHoursStart":"22:00","quietHoursEnd":"08:00","reminderNoOpenDays":3}' | jq .

# Register push token (mobile app)
curl -s -X POST http://localhost:3000/api/v1/push-tokens \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[xxxxxxxxxxxxxxxxxx]","platform":"ios"}' | jq .
```

---

## Demo 5 — Link management

```bash
# List all links for a property
curl -s http://localhost:3000/api/v1/properties/$PROP_ID/share-links \
  -H "Authorization: Bearer $TOKEN" | jq .

# Deactivate a specific link
curl -s -X PATCH http://localhost:3000/api/v1/share-links/$LINK_ID/deactivate \
  -H "Authorization: Bearer $TOKEN" | jq .

# Verify deactivated link is no longer accessible
curl -s http://localhost:3000/api/v1/v/$LINK_TOKEN | jq .
# Expected: 410 Gone
```

---

## Demo 6 — Agency & team

```bash
# Create agency
AGENCY_ID=$(curl -s -X POST http://localhost:3000/api/v1/agencies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Agence Côte Azur","email":"contact@coteazur.fr","phone":"+33493000000"}' \
  | jq -r .data.id)

# Invite a colleague
curl -s -X POST http://localhost:3000/api/v1/agencies/$AGENCY_ID/invites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"colleague@demo.com","role":"agent"}' | jq .

# Customize branding
curl -s -X PUT http://localhost:3000/api/v1/agencies/$AGENCY_ID/branding \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"primaryColor":"#0F3460","secondaryColor":"#E94560","agencyName":"Côte Azur Premium"}' | jq .
```

---

## Test Coverage Summary

| Module        | Tests | Status |
|---------------|-------|--------|
| Auth          | ✅    | integration + unit |
| Agency        | ✅    | integration |
| Property      | ✅    | integration |
| Page          | ✅    | integration |
| Contact/Share | ✅    | integration |
| Tracking      | ✅    | integration |
| Partner       | ✅    | integration |
| Notification  | ✅    | integration (added 2026-03-05) |
| Branding      | ✅    | integration |
| Media         | ✅    | integration (added 2026-03-05) |

**Total: 451 tests — 29 suites — all green**

