# Handoff: Calm UI continuation

Continue the Direction A “calm mosque” visual language across the remaining app, and extract a small reusable calm component set so screens stop copying StyleSheet tokens.

## Product / visual language (source of truth)

Already established on Home, Donate, Events:

- Canvas: `theme.colors.surface.muted`
- Content: white **panels** with `StyleSheet.hairlineWidth` + `border.soft` (not heavy `shadow.soft` stacks)
- Intro: compact title (`fontWeight: "600"`) + one muted subtitle
- Labels: small uppercase muted `blockLabel` (letterSpacing ~0.6)
- Chips: hairline border; selected = navy border + `accent.blueSoft` fill
- Primary CTA: `brand.navy[800]`, `radius.lg`, semibold (Donate)
- Gold: meaningful accents only (selected recurring, Today chip, progress)
- No emoji in UX chrome; Ionicons preferred
- Typography: Poppins via app defaults; avoid `fontWeight: "800"` / oversized heroes

**Reference screens (do not regress):**

- [`app/(tabs)/index.tsx`](app/(tabs)/index.tsx) — prayer table + Jumu’ah table on one screen (no pill toggle)
- [`app/(tabs)/donate/give.tsx`](app/(tabs)/donate/give.tsx) — amount-first form, sticky CTA
- [`app/(tabs)/donate/history.tsx`](app/(tabs)/donate/history.tsx), [`manage.tsx`](app/(tabs)/donate/manage.tsx)
- [`app/(tabs)/events.tsx`](app/(tabs)/events.tsx)
- Prototypes: [`prototypes/donate-direction-a.html`](prototypes/donate-direction-a.html), [`prototypes/events-calm.html`](prototypes/events-calm.html)

**Parent shells keep** navy gradient headers + `PatternOverlay` (Donate, Events, More, Home).

## Already done

- Donate Give redesign (Direction A); no donation-type picker (general vs campaign only)
- Donate History + Manage unified
- Home: prayer table UI; Jumu’ah merged onto main screen; Prayer/Jumu’ah toggle removed
- Events restyled to calm language (in-app + HTML mockup)

## Orphan / legacy UI components

Still in `components/ui/` but **unused by screens** after Events pass:

- `Card.tsx`, `PillButton.tsx`, `Badge.tsx`, `SectionHeader.tsx` (Badge only used by SectionHeader)

Still used:

- `PillToggle.tsx` — Donate index + History one-time/recurring
- `NextBanner.tsx`, `UpdatingBanner.tsx` — Home
- `InstagramIcon.tsx` — More

**Do not** keep duplicating chip/panel styles. Either restyle legacy components into the calm set below, or delete orphans after the kit exists.

## Work to complete (recommended order)

### 1. Calm component kit (do this first)

Add under `components/ui/calm/` (or restyle existing files in place — prefer a clear `calm/` folder to avoid breaking anything mid-migration):

| Component | Role | Pull tokens from |
|-----------|------|------------------|
| `Panel` | Hairline bordered white surface | Give `panel` / Events `eventCard` |
| `ScreenIntro` | Title + subtitle | Give/Manage/History intro |
| `Chip` / `ChipGroup` | Selectable filter/option chips | Events category chips / Give frequency |
| `BlockLabel` | Uppercase section label | Give `blockLabel` |
| `PrimaryButton` | Navy-800 full-width CTA | Give/Manage/History CTA |
| `ListRow` | Quiet tappable row (icon optional, chevron) | For More / Settings |
| Soften `PillToggle` | Align selected state with Chip language (less shadow) | Donate tabs |

Also add a tiny `constants/calm.ts` or export shared style helpers only if needed — prefer components over a mega StyleSheet.

**Migrate opportunistically:** when touching a screen, swap local duplicates for kit components. After More + Settings, optionally refactor Give/Events chip/panel blocks onto the kit (keep behavior identical).

### 2. More tab — highest priority

File: [`app/(tabs)/more.tsx`](app/(tabs)/more.tsx)

Current issues: heavy `infoItem` cards with colorful icon wells + soft shadows; feels like old design vs Home/Events.

Target:

- Keep gradient header (match Events: short title “More” / “About Al Ansar” if needed)
- Group About / Connect / App info into **Panels** with `ListRow`s
- Quieter icons (soft tint wells, not loud solid color circles) unless brand colors are intentional for map/phone/etc. — prefer muted wells + navy/gold accents
- Same hairline / spacing language as Events

Logic (linking, haptics, EmptyState) stays.

### 3. Settings + notification settings

Files: [`app/settings.tsx`](app/settings.tsx), [`screens/NotificationSettingsScreen.tsx`](screens/NotificationSettingsScreen.tsx)

- Theme options as calm `ListRow` / segment inside a `Panel`
- Notification toggles: quiet rows + Switch (like Give anonymous toggle)
- Keep Expo Stack header or align with navy header pattern already used

### 4. Qibla — light polish only

File: [`app/(tabs)/qibla.tsx`](app/(tabs)/qibla.tsx)

Compass-first screen — **do not** force table/panel layout. Optional: calm status/error copy, permission empty states matching `EmptyState`, header consistency. Leave compass math alone.

### 5. Cleanup

- Delete unused `Card` / `PillButton` / `Badge` / `SectionHeader` **or** reimplement them as thin wrappers over the calm kit
- `npm run lint` (watch `react/no-unescaped-entities` for `Jumu'ah` — use `{"Jumu'ah"}`)
- Manual: tab through Home → Events → Donate → More → Settings

### Out of scope (unless asked)

- Debug/production side-by-side `applicationIdSuffix` (parked)
- Play Console testing / Firebase package registration
- Backend / donation type Firestore schema changes

## Constraints (project rules)

- Expo SDK 54 / RN; prefer Expo packages; no new test frameworks
- Don’t casually edit `index.js`, `metro.config.js`, `firebase.ts`, `eas.json`, `app.json`
- `android/` only when required
- Path alias `@/*` → project root
- Match existing Strict TS / hooks patterns

## Suggested first message in a new chat

> Continue calm UI from `.cursor/handoffs/calm-ui-continuation.md`. First build the calm component kit (`Panel`, `ScreenIntro`, `Chip`, `BlockLabel`, `PrimaryButton`, `ListRow`), soften `PillToggle`, then restyle More and Settings to use the kit. Don’t regress Home / Donate / Events. Lint when done.

## Verify

- Lint clean
- More + Settings look consistent with Events/Donate
- Kit used on new work (no fresh copy-paste of panel/chip styles)
- Qibla still works (compass + permissions)

## Status (2026-09-16)

Completed: calm kit, PillToggle soften, More/Settings, Give/Events/History/Manage migration, Qibla polish, orphan UI deletion, analytics + donation modals calmed. Remaining: manual device tab-through only.
