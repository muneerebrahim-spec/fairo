# Fairo — Native iOS (SwiftUI)

Native SwiftUI iOS app implementing **Fairo Phase 1** per the build spec and Sage v2 design system.

## Requirements

- macOS with **Xcode 16+**
- iOS **17.0+** (simulator or device)
- Apple Developer account (for physical device testing)

## Open in Xcode

1. Clone or pull this repo on your Mac
2. Open the project:

   ```bash
   open ios/Fairo/Fairo.xcodeproj
   ```

3. Select the **Fairo** scheme
4. Choose an **iPhone simulator** (e.g. iPhone 16) or your connected iPhone
5. Press **⌘R** to build and run

## First-run testing

**Without camera (simulator):**

1. Tap **New Split**
2. Tap **Use Sample Receipt**
3. Choose **Full list edit** or **Step-through**
4. Add participants → **By Item** → assign items → tip → summary

**With camera (device):**

1. Tap **New Split** → **Scan with Camera**
2. Capture the receipt — Vision OCR reads line items automatically
3. Continue through review, participants, assign, tip, summary

Saved people appear as quick-add chips on the Participants screen after you've added them once.

## Project structure

```
Fairo/
├── FairoApp.swift          App entry + SwiftData container
├── Models/                 Split models + SwiftData entities
├── Services/               OCR, parser, persistence, reconciliation, tip math
├── ViewModels/             SplitFlowViewModel (MVVM)
├── Views/                  SwiftUI screens + navigation
├── Theme/                  Sage v2 design tokens
└── Assets.xcassets/
```

## Signing for a physical iPhone

1. In Xcode, select the **Fairo** target → **Signing & Capabilities**
2. Set your **Team** (Apple ID)
3. Xcode will manage the provisioning profile automatically
4. Connect your iPhone and select it as the run destination

## Phase 1 features included

- Full split flow (capture → review → participants → assign → reconcile → tip → summary)
- Sage v2 UI (gradient hero card, gold badges, rounded-square avatars, dark mode)
- VisionKit document scanner + Vision OCR for real receipt capture
- Sample receipt fallback for simulator testing
- Item assignment with haptics
- Reconciliation engine
- Tip presets and per-person totals
- Share sheet text export
- SwiftData persistence (split history + saved people)
- Legacy UserDefaults history auto-migration

## Bundle ID

`app.fairo.split` — change in Xcode if needed.
