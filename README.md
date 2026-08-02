# Fairo

Native iOS bill-splitting app (Phase 1) — scan receipts, assign items, reconcile, tip, and share.

Built with **Expo / React Native** for iOS development and preview. Implements the Phase 1 spec: OCR scanning pipeline, correction modes, people/groups, item assignment, dynamic tip, reconciliation, even/% fallback split, and local sharing.

## Design

Follows the **Sage v2** design system from the Phase 1 mockup:

- Background `#F6F7F2` / `#0A130E` (dark)
- Emerald gradient hero cards and primary actions
- Gold `#D97706` pop color for status badges and selected states
- Rounded-square avatars, 20px cards, hairline borders

## Preview & test

### Browser (quick preview)

```bash
npm install
npm run web
```

Open **http://localhost:8081**

### iPhone (native)

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. Run `npm start` and scan the QR code

Use **"Use Sample Receipt"** on the Capture screen to walk through the full flow without a camera.

## Phase 1 flow

Home → New Split → Capture → Processing → Review mode → Review items → Participants → Split mode → Assign items → Reconcile → Tip → Summary → Save or Discard

## Tech stack

- Expo SDK 57 · React Native · TypeScript
- React Navigation
- AsyncStorage (local persistence)
- expo-image-picker · expo-haptics · expo-linear-gradient

## Note on native APIs

The build spec references SwiftUI, VisionKit, and SwiftData. This Expo implementation mirrors the same data model, flows, and visual design using React Native equivalents so you can preview and iterate in Cursor Cloud. A future native SwiftUI shell can reuse the same spec and design tokens.

## License

MIT
