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

## First-run testing (no camera needed)

1. Tap **New Split**
2. Tap **Use Sample Receipt**
3. Choose **Full list edit** or **Step-through**
4. Add participants → **By Item** → assign items → tip → summary

## Project structure

```
Fairo/
├── FairoApp.swift          App entry
├── Models/                 Split, LineItem, TipConfig, etc.
├── Services/               Receipt parser, reconciliation, tip math
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
- Sample receipt OCR parsing
- Item assignment with haptics
- Reconciliation engine
- Tip presets and per-person totals
- Share sheet text export
- Local history (UserDefaults)

## Coming next

- VisionKit document scanner (`VNDocumentCameraViewController`)
- Live Vision OCR (`VNRecognizeTextRequest`)
- SwiftData persistence
- Saved people / households

## Bundle ID

`com.muneerebrahim.fairo` — change in Xcode if needed.
