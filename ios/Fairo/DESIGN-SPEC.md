# Fairo Design Spec (Sage v2)

**Version:** 1.0 · Phase 1  
**Platform:** Native iOS (SwiftUI), iOS 17+  
**App name:** Fairo (never SplitEase / FairSplit in UI copy)

Use this document when working with a **local Cursor agent**. Point the agent at this file:

> Follow `ios/Fairo/DESIGN-SPEC.md` for all UI work. Match existing components in `FairoComponents.swift` and tokens in `FairoTheme.swift`. Do not invent new colors or radii.

---

## 1. Product intent

Fairo helps friends split a restaurant receipt fairly. The UX should feel **calm, trustworthy, and quick** — like a well-designed finance app, not a spreadsheet.

**Core loop:** Scan → Review items → Add people → Assign items → Tip → Summary → Share

**Design personality:**
- Sage green = trust, money settled
- Warm gold pop = attention, selection, unresolved state
- Soft off-white backgrounds = readable, not sterile
- Rounded-square avatars = people, not corporate

---

## 2. Design system — Sage v2 tokens

**Source of truth:** `Fairo/Theme/FairoTheme.swift`

Always read colors from `FairoColors.light` / `FairoColors.dark` via:

```swift
@Environment(\.colorScheme) private var scheme
private var theme: FairoColors { scheme == .dark ? .dark : .light }
```

### 2.1 Color palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | `#F6F7F2` | `#0A130E` | Screen canvas |
| `card` | `#FFFFFF` | `#12201A` | Cards, secondary buttons |
| `textPrimary` | `#10201A` | `#EEF5EF` | Headlines, item names |
| `textSecondary` | `#7A8A7F` | `#8FA396` | Subtitles, metadata |
| `accentDeep` | `#047857` | `#10B981` | Links, totals, primary accent |
| `accentBright` | `#10B981` | `#34D399` | Gradient end, highlights |
| `pop` | `#D97706` | `#F59E0B` | Badges, selection ring, unassigned dot |
| `border` | `#E2E9E0` | `#1D3327` | Card strokes |

### 2.2 Gradients

- **Primary gradient:** `accentDeep` → `accentBright`, topLeading → bottomTrailing
- Used on: hero cards, primary buttons, share button
- Component: `FairoGradient()` or inline `LinearGradient` in `HeroCard`

### 2.3 Radii (do not change without updating spec)

| Token | Value | Used on |
|-------|-------|---------|
| `cardRadius` | 20pt | `FairoCard` |
| `heroRadius` | 22pt | `HeroCard` |
| `buttonRadius` | 15pt | All buttons |
| `avatarRadius` | 12pt | `AvatarView` |
| Line item row | 16pt | `LineItemRowView` |

### 2.4 Typography

Use SF Pro (system font). No custom fonts in Phase 1.

| Role | Size | Weight | Color |
|------|------|--------|-------|
| App title | 34pt | Bold | `textPrimary` |
| Screen title | 28pt | Bold | `textPrimary` |
| Section label | 13pt | Semibold + 0.8 tracking | `textSecondary` ALL CAPS |
| Card headline | 17–22pt | Semibold/Bold | `textPrimary` or white on hero |
| Body | 15–16pt | Regular | `textSecondary` |
| Button label | 16pt | Semibold | white or `textPrimary` |
| Caption | 12–13pt | Regular/Medium | `textSecondary` |
| Hero total | 36–38pt | Bold | white or `textPrimary` |
| Money emphasis | 18–28pt | Bold | `accentDeep` or white |

### 2.5 Spacing

| Context | Value |
|---------|-------|
| Screen horizontal padding | 20pt |
| Section vertical gap | 24pt |
| Card internal padding | 20pt (FairoCard) / 24pt (HeroCard) |
| Stack item gap | 12–16pt |
| Avatar grid gap | 16pt |

---

## 3. Component library

**Source of truth:** `Fairo/Views/Components/FairoComponents.swift`

| Component | When to use | Rules |
|-----------|-------------|-------|
| `HeroCard` | One focal promo block per screen (Home, Capture hint, Summary total) | White text inside. **Content must drive height** — never zero-height ZStack. No nested primary buttons inside hero; place CTA below. |
| `FairoCard` | Grouped content, list rows, forms | White/dark card + 1pt border |
| `FairoPrimaryButton` | Main action per section | Gradient fill; `secondary: true` for alternate |
| `PopBadge` | Status: "Balanced", "Scanned", "All assigned" | Gold capsule, white text |
| `AvatarView` | People everywhere | Initials, rounded square, palette color. Selected = gold ring (`theme.pop`, 2.5pt) |
| `LineItemRowView` | Receipt lines in assign + summary | Unassigned = gold dot; assigned = overlapping mini avatars |
| `FairoGradient` | Primary button / share backgrounds | Always respect color scheme |

### 3.1 Avatar colors

From `AvatarPalette.colors` in `SplitModels.swift`:

```
#047857, #0D9488, #0891B2, #7C3AED, #DB2777, #D97706, #DC2626, #2563EB
```

Assign by participant index modulo palette length.

### 3.2 Button hierarchy (per screen)

1. **One primary action** — gradient `FairoPrimaryButton`
2. **Secondary action** — `FairoPrimaryButton(secondary: true)`
3. **Tertiary / destructive** — secondary style or plain text in `theme.pop` only for "Disregard" / "Discard"

---

## 4. Layout rules (critical)

These prevent known bugs:

1. **HeroCard sizing:** Content first, background behind. Pattern:
   ```swift
   content
     .padding(24)
     .frame(maxWidth: .infinity, alignment: .leading)
     .background { /* gradient */ }
     .clipShape(RoundedRectangle(...))
   ```
2. **Never** put a clear-fill `RoundedRectangle` in a bare `ZStack` as the only sizing element.
3. **Screen background:** Always `theme.background` on root; cards float above.
4. **Navigation:** Inline title for flow screens; Home hides nav bar.
5. **Safe area:** Standard 20pt padding; bottom assign dock uses `theme.card` background + top divider.
6. **Dark mode:** Every new view must use `FairoColors` — no hardcoded `.black` / `.white` except on gradient heroes and primary buttons.

---

## 5. Screen specifications

**Navigation map:** `RootView.swift` → `FlowRoute`

### 5.1 Home (`HomeView`)

**Purpose:** Entry + history

**Layout (top → bottom):**
1. Title block: "Fairo" + "Split bills fairly"
2. `HeroCard`: "Scan. Assign. Done." + one-line description (white text)
3. `FairoPrimaryButton` "New Split" **below** hero (not inside)
4. Section label: `HISTORY`
5. Empty state card OR history rows

**History row:** Title, date, people/item count left; **amount right** in `accentDeep` bold.

**Empty state:** Clock icon + "No saved splits yet" + helper text.

---

### 5.2 Capture (`CaptureView`)

**Purpose:** Start scan

**Layout:**
1. Screen title + subtitle
2. `HeroCard` with viewfinder icon + "Point at the receipt"
3. Primary: "Scan with Camera" (device only)
4. Secondary: "Use Sample Receipt"
5. Simulator footnote when camera unavailable

**Rules:**
- `#if targetEnvironment(simulator)` — disable camera; never instantiate `VNDocumentCameraViewController` on simulator
- Show processing overlay during OCR: dim + spinner + "Reading receipt…"

---

### 5.3 Review mode (`CorrectionModeView`)

**Purpose:** Choose step-through vs full list

**Layout:**
1. Title + subtitle
2. Scanned summary card (merchant, item count, total) + `PopBadge` "Scanned"
3. Two option cards with embedded CTAs

---

### 5.4 Review items

**Step-through (`ReviewStepThroughView`):** One item card, Confirm + Disregard, progress "Item X of Y"

**Full list (`ReviewFullListView`):** Editable name/amount fields per item, Disregard/Restore, Continue

**Low OCR confidence:** Show gold `?` badge on line items (`ocrConfidence < 0.75`)

---

### 5.5 Adjustment (`AdjustmentPromptView`)

**Purpose:** Resolve discounts / service charges

Card with amount; two buttons: "Treat as its own line item" / "Apply proportionally"

---

### 5.6 Participants (`ParticipantsView`)

**Purpose:** Who's splitting

**Layout:**
1. Screen title
2. **Saved people** horizontal chips (if any) — avatar + name in capsule
3. Add-new field inside `FairoCard`
4. Section: `IN THIS SPLIT` — avatar grid (52pt avatars)
5. Continue (disabled until ≥1 participant)

---

### 5.7 Split mode (`SplitModeView`)

Three stacked cards: **By Item** (primary path), Even, Percentage

---

### 5.8 Assign items (`AssignItemsView`) — key screen

**Layout:**
1. Title + instruction
2. Progress: "X of Y assigned" + `PopBadge` "All assigned" when complete
3. Scrollable `LineItemRowView` list; tap to select (gold border + tint)
4. **Fixed bottom dock:**
   - "Assigning: {item name}" or "Select an item above"
   - Label `ASSIGN TO`
   - Horizontal avatar scroller (52pt, gold ring when assigned)
5. Continue button

**Interaction:** Light haptic on assign toggle (`UIImpactFeedbackGenerator`)

---

### 5.9 Reconcile (`ReconciliationView`)

Shown when items unassigned. List unassigned items; "Split evenly across everyone" primary; back secondary.

---

### 5.10 Tip (`TipView`)

Preset chips: None / 10% / 15% / 20%. Tip total card. Per-person preview cards. "View summary"

---

### 5.11 Summary (`SummaryView`) — key screen

**Layout:**
1. `HeroCard`: Total (large), merchant + date, people/item count, `PopBadge` "Balanced" if reconciled
2. Section `PER PERSON` — card per participant: avatar, name, breakdown line, **total right** in `accentDeep`
3. Section `ITEMS` — `LineItemRowView` list
4. Share button (gradient, full width)
5. If not readonly: "Save to History" + "Discard"

**Readonly mode:** Opened from Home history — hide save/discard.

---

## 6. Interaction & motion

| Action | Feedback |
|--------|----------|
| Assign toggle | Light impact haptic |
| Reconciliation balanced | Success notification haptic |
| Save to history | Success notification haptic |
| Button press | No custom animation Phase 1; rely on SwiftUI default |

No swipe gestures in Phase 1. Use standard back chevron navigation.

---

## 7. Platform constraints

| Feature | Simulator | Physical device |
|---------|-----------|-----------------|
| Sample receipt | ✅ | ✅ |
| Document scanner | ❌ Disabled | ✅ |
| Vision OCR | ❌ (use sample) | ✅ |
| SwiftData | ✅ | ✅ |
| Haptics | Silent no-op | ✅ |

---

## 8. File map for agents

```
ios/Fairo/Fairo/
├── Theme/FairoTheme.swift          ← tokens, Color(hex:), FairoGradient
├── Views/Components/
│   ├── FairoComponents.swift       ← reusable UI (edit here first)
│   └── DocumentScannerView.swift   ← camera wrapper (simulator-safe)
├── Views/
│   ├── RootView.swift              ← HomeView, FlowRoute
│   ├── FlowViews.swift             ← Capture, Review, Adjustment
│   └── SplitFlowViews.swift        ← Participants, Assign, Tip, Summary
├── ViewModels/SplitFlowViewModel.swift
└── Models/SplitModels.swift        ← AvatarPalette
```

**When adding UI:** Extend existing components before creating new ones.  
**When adding a screen:** Register route in `FlowRoute` + `RootView.navigationDestination`.

---

## 9. Copy deck (use verbatim unless noted)

| Location | Copy |
|----------|------|
| App tagline | Split bills fairly |
| Hero headline | Scan. Assign. Done. |
| Hero body | Snap a receipt, assign items to friends, and share who owes what. |
| Primary CTA | New Split |
| Capture title | Scan receipt |
| Assign instruction | Tap an item, then tap people below. |
| Assign dock label | ASSIGN TO |
| Summary sections | PER PERSON · ITEMS |
| History section | HISTORY |
| Saved people section | SAVED PEOPLE |
| Active participants | IN THIS SPLIT |
| Balanced badge | Balanced |
| Share CTA | Share breakdown |
| Save CTA | Save to History |

---

## 10. Agent prompt templates

Copy one of these into Cursor when starting local work:

### Polish a screen
```
Open ios/Fairo/DESIGN-SPEC.md section 5.x for [ScreenName].
Update [FilePath] to match the spec. Use FairoColors and existing components only.
Verify light + dark mode. Do not change business logic.
```

### Fix layout bug
```
HeroCard / layout bug on [screen]. Read DESIGN-SPEC.md section 4 (Layout rules).
Fix sizing so content does not overlap. Match Home screen pattern in RootView.swift.
```

### New component
```
Need [component] for Phase 1. Check DESIGN-SPEC.md section 3 first.
If truly new, add to FairoComponents.swift using FairoTheme tokens. Document in section 3 of DESIGN-SPEC.md.
```

### Full UI audit
```
Audit all screens in ios/Fairo/Fairo/Views/ against ios/Fairo/DESIGN-SPEC.md.
List gaps per screen. Then fix highest-impact gaps only (Assign Items, Summary, Home first).
```

---

## 11. Acceptance checklist

Before considering UI work done:

- [ ] Light and dark mode both readable
- [ ] All colors from `FairoColors` (no stray hex in views)
- [ ] Hero cards size correctly (no overlapping headers)
- [ ] Primary button is obvious on each screen
- [ ] Gold pop used only for: badges, selection, unassigned, low-confidence OCR
- [ ] Green gradient used only for: hero, primary actions, share
- [ ] Avatars are rounded squares with initials
- [ ] Section labels are uppercase + tracked
- [ ] Simulator does not crash on Capture screen
- [ ] Builds in Xcode without new warnings in edited files

---

## 12. Out of scope (Phase 1)

Do not implement in UI work unless explicitly requested:

- Households / groups
- Custom fonts or illustrations
- Animations beyond system defaults
- iPad layout
- Onboarding carousel
- Settings screen
- Paywall / subscriptions

---

## 13. Reference mockup alignment

Original mockup: **SplitEase Design Mockup (Sage v2)** — warm sage background, green gradient hero, gold accent for status/selection, white cards with soft borders, rounded-square avatars, generous whitespace.

When in doubt: **prefer more whitespace, fewer borders, one clear primary action per screen.**
