# Changelog

All notable changes to ImmoShare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-15

### Added

- **Mobile — "Add Contact" screen** (`apps/mobile/src/screens/Share/ContactCreateScreen.tsx`).
  A dedicated form (name required; email, phone, company, notes optional) that creates a
  contact through the store → service → `POST /api/v1/contacts`, then returns to the list
  (which refreshes from the store). Handles validation, loading and error states.
- Registered the `ContactCreate` route in the Share stack and added a clear
  **"+ Add Contact"** entry point in `ContactListScreen` (the share FAB is unchanged).
- Jest tests for `ContactCreateScreen` (render, name validation, submit payload, empty-field
  omission, error handling).

## [0.1.0] - 2026-08-14

Initial documented baseline (mobile app + backend API).
