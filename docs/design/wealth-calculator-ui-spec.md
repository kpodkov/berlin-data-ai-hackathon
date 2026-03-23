# Wealth Growth Calculator — UI/UX Design Spec

**Date:** 2026-03-23
**Status:** MVP design spec

---

## 1. Design Philosophy

The app is a confidence-builder, not a form. Each tier should feel like a conversation that rewards disclosure with insight. Users who complete all three tiers get a genuinely personal picture of their finances — not generic advice. The visual language borrows from financial terminals (precision, authority) softened with approachable typography.

**Core principles:**
- Inputs on the left, results on the right (desktop) — never on separate pages
- Results update in real time as the user types — no submit button
- Each tier is a complete product; advancing is a choice, not a requirement
- Privacy is a design element, not a footnote

---

## 2. Color Palette

### Light Mode

| Semantic Name | Hex | Usage |
|---|---|---|
| `background` | `#F7F8FC` | Page background |
| `surface` | `#FFFFFF` | Card and panel backgrounds |
| `surface-raised` | `#EEF0F8` | Hover states, tier unlock banners |
| `border` | `#DDE1EE` | Dividers, input borders |
| `border-focus` | `#4F63FF` | Focused input ring |
| `text-primary` | `#111827` | Headings, key numbers |
| `text-secondary` | `#6B7280` | Labels, supporting copy |
| `text-muted` | `#9CA3AF` | Placeholder text, disabled states |
| `accent-blue` | `#4F63FF` | Primary CTAs, active states, conservative projection line |
| `accent-emerald` | `#10B981` | Positive deltas, income vs median above |
| `accent-amber` | `#F59E0B` | Warnings, moderate projection line |
| `accent-rose` | `#F43F5E` | Debt drag, negative deltas, aggressive projection line |
| `accent-violet` | `#8B5CF6` | Inflation overlay, personal inflation rate |
| `chart-grid` | `#E5E7EB` | Chart gridlines |
| `chart-tooltip-bg` | `#1F2937` | Tooltip background (dark in light mode for contrast) |
| `privacy-badge-bg` | `#EEF2FF` | Privacy badge background |
| `privacy-badge-text` | `#3730A3` | Privacy badge text |
| `tier-locked` | `#F3F4F6` | Locked tier card background |
| `tier-locked-border` | `#D1D5DB` | Locked tier card border |

### Dark Mode

| Semantic Name | Hex | Usage |
|---|---|---|
| `background` | `#0D0F1A` | Page background |
| `surface` | `#161827` | Card and panel backgrounds |
| `surface-raised` | `#1E2236` | Hover states, tier unlock banners |
| `border` | `#2D3154` | Dividers, input borders |
| `border-focus` | `#6B7EFF` | Focused input ring |
| `text-primary` | `#F1F5F9` | Headings, key numbers |
| `text-secondary` | `#94A3B8` | Labels, supporting copy |
| `text-muted` | `#64748B` | Placeholder text, disabled states |
| `accent-blue` | `#6B7EFF` | Primary CTAs, active states, conservative projection line |
| `accent-emerald` | `#34D399` | Positive deltas |
| `accent-amber` | `#FBBF24` | Warnings, moderate projection line |
| `accent-rose` | `#FB7185` | Debt drag, negative deltas, aggressive projection line |
| `accent-violet` | `#A78BFA` | Inflation overlay |
| `chart-grid` | `#1E2236` | Chart gridlines |
| `chart-tooltip-bg` | `#F1F5F9` | Tooltip background (light in dark mode) |
| `privacy-badge-bg` | `#1E1E3F` | Privacy badge background |
| `privacy-badge-text` | `#A5B4FC` | Privacy badge text |
| `tier-locked` | `#131525` | Locked tier card background |
| `tier-locked-border` | `#252840` | Locked tier card border |

### Chart Color Assignments

Chart series must be readable in both modes. Use the semantic names above — never hardcode hex in chart configs.

| Series | Semantic Token | Rationale |
|---|---|---|
| Conservative projection | `accent-blue` | Calm, safe |
| Moderate projection | `accent-amber` | Middle ground |
| Aggressive projection | `accent-rose` | High risk, visible warning |
| National median reference | `text-muted` | Contextual, not dominant |
| Debt drag fill | `accent-rose` at 20% opacity | Area fill, not line |
| Inflation overlay | `accent-violet` | Distinct from wealth lines |
| Nominal vs real split | dashed vs solid on same color | Same series, different treatment |

---

## 3. Typography

**Font stack:**

| Role | Font | Fallback |
|---|---|---|
| Headings | Inter | system-ui, sans-serif |
| Body / labels | Inter | system-ui, sans-serif |
| Numbers / data | JetBrains Mono | monospace |

Use JetBrains Mono exclusively for currency values, percentages, and chart axis labels. This creates a terminal-like precision for numbers while keeping prose readable in Inter.

**Type scale:**

| Token | Size | Weight | Usage |
|---|---|---|---|
| `display` | 32px | 700 | Hero number (projected wealth at retirement) |
| `heading-1` | 24px | 700 | Section titles |
| `heading-2` | 18px | 600 | Card titles, tier headers |
| `heading-3` | 14px | 600 | Input group labels, chart legends |
| `body` | 14px | 400 | Body copy, explanatory text |
| `label` | 13px | 500 | Input labels |
| `caption` | 12px | 400 | Data source citations, footnotes |
| `mono-large` | 28px | 700 | Primary KPI numbers |
| `mono-medium` | 16px | 600 | Secondary stats in benchmark cards |
| `mono-small` | 13px | 400 | Chart axis labels, data table values |

**Spacing system:** 4px base unit. Use multiples: 4, 8, 12, 16, 24, 32, 48, 64.

**Line height:** 1.5 for body, 1.2 for headings and display numbers.

---

## 4. Component Tree

```
App
├── AppShell
│   ├── TopBar
│   │   ├── BrandMark (wordmark + icon)
│   │   ├── PrivacyBadge
│   │   └── ThemeToggle
│   └── MainLayout
│       ├── InputPanel (left/top)
│       │   ├── TierStack
│       │   │   ├── TierCard [Tier 1 — Quick Start]
│       │   │   │   ├── TierHeader (number, title, description)
│       │   │   │   ├── InputGroup
│       │   │   │   │   ├── NumberInput [Age]
│       │   │   │   │   ├── CurrencyInput [Annual Income]
│       │   │   │   │   └── CurrencyInput [Monthly Investment]
│       │   │   │   └── TierUnlockButton → Tier 2
│       │   │   ├── TierCard [Tier 2 — Financial Snapshot] (locked until T1 complete)
│       │   │   │   ├── TierHeader
│       │   │   │   ├── InputGroup
│       │   │   │   │   ├── CurrencyInput [Current Savings]
│       │   │   │   │   ├── RiskToggle [conservative / moderate / aggressive]
│       │   │   │   │   ├── OwnershipToggle [rent / own]
│       │   │   │   │   ├── CurrencyInput [Monthly Housing Cost]
│       │   │   │   │   ├── CurrencyInput [Credit Card Debt]
│       │   │   │   │   └── CurrencyInput [Other Debt]
│       │   │   │   └── TierUnlockButton → Tier 3
│       │   │   └── TierCard [Tier 3 — Personal Inflation] (locked until T2 complete)
│       │   │       ├── TierHeader
│       │   │       ├── InputGroup
│       │   │       │   ├── CurrencyInput [Food]
│       │   │       │   ├── CurrencyInput [Transport]
│       │   │       │   ├── CurrencyInput [Healthcare]
│       │   │       │   ├── CurrencyInput [Education]
│       │   │       │   └── CurrencyInput [Energy / Utilities]
│       │   │       └── TierCompleteState
│       │   └── DataSourceFooter
│       └── ResultsPanel (right/bottom)
│           ├── ResultsPlaceholder (shown before T1 is filled)
│           ├── Tier1Results
│           │   ├── WealthProjectionChart
│           │   ├── BenchmarkRow
│           │   │   ├── BenchmarkCard [Projected Wealth at 65]
│           │   │   ├── BenchmarkCard [vs National Median Income]
│           │   │   └── BenchmarkCard [Monthly Savings Rate]
│           │   └── ChartLegend
│           ├── Tier2Results (mounts below T1 on T2 unlock)
│           │   ├── DebtAnalysisPanel
│           │   │   ├── DebtDragBar
│           │   │   └── DebtFreeProjectionOverlay
│           │   ├── HousingBenchmarkCard
│           │   └── SavingsRateComparisonCard
│           └── Tier3Results (mounts below T2 on T3 unlock)
│               ├── PersonalInflationCard
│               ├── RealVsNominalToggle
│               └── CategoryInflationChart
```

### Component Descriptions

**TierCard:** A rounded card with a visible tier number badge (01, 02, 03) in the top-left corner. Tier 1 is always open. Tiers 2 and 3 render in a visually dimmed "locked" state — same card shape, same border, but `tier-locked` background and a centered lock icon with unlock prompt. Locked tiers do not show input fields until unlocked.

**TierUnlockButton:** Appears at the bottom of each completed tier. Not a primary CTA button — styled as a subtle text link with a right-chevron: "Add more detail →". Clicking it expands the next TierCard with a smooth height animation (no page scroll required on desktop).

**NumberInput / CurrencyInput:** Full-width within the input group. Currency inputs always show a leading `$` glyph in the input prefix slot. On focus, the border transitions to `border-focus` color. Values format with commas on blur (e.g., `50000` becomes `50,000`). Tab key advances to the next input within the tier.

**RiskToggle:** A segmented control with three options: conservative, moderate, aggressive. The selected option fills with `accent-blue` background. The unselected options have `surface-raised` background. Selecting a different risk level immediately re-renders the projection chart lines.

**OwnershipToggle:** Same segmented control pattern as RiskToggle, two options: Rent / Own.

**WealthProjectionChart:** The hero visualization. See Section 6 for full chart spec.

**BenchmarkCard:** A compact stat card showing a single KPI with a label, a large mono number, and a delta indicator (up/down arrow + percentage vs national median from FRED). Cards sit in a horizontal row on desktop, vertical stack on mobile.

**PrivacyBadge:** A small pill in the top bar. Lock icon + "All calculations run in your browser. No data is sent anywhere." The badge is always visible. Clicking it opens a modal with a one-paragraph explanation.

**DebtDragBar:** A horizontal bar showing current debt vs projected savings at the same time horizon. Uses a grouped bar structure — see Section 6.

**PersonalInflationCard:** Large card showing user's calculated personal inflation rate vs the FRED-reported CPI, displayed as a number comparison with a sentence of context below.

**CategoryInflationChart:** See Section 6.

---

## 5. Layout

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar: [BrandMark]                [PrivacyBadge] [ThemeToggle] │
├────────────────────────┬────────────────────────────────────────┤
│                        │                                        │
│   InputPanel           │   ResultsPanel                         │
│   width: 380px fixed   │   flex: 1, min-width: 0               │
│   overflow-y: auto     │   overflow-y: auto                     │
│                        │                                        │
│  [TierCard 01]         │  [WealthProjectionChart]               │
│    age                 │    full width of results panel         │
│    income              │    height: 320px                       │
│    monthly investment  │                                        │
│                        │  [BenchmarkRow]                        │
│  [TierUnlockButton]    │    3 cards in equal columns            │
│                        │                                        │
│  [TierCard 02] locked  │  ── after T2 unlock ──                 │
│                        │                                        │
│  [TierCard 03] locked  │  [DebtAnalysisPanel]                   │
│                        │  [HousingBenchmarkCard]                │
│                        │  [SavingsRateComparisonCard]           │
│  [DataSourceFooter]    │                                        │
│                        │  ── after T3 unlock ──                 │
│                        │                                        │
│                        │  [PersonalInflationCard]               │
│                        │  [CategoryInflationChart]              │
│                        │                                        │
└────────────────────────┴────────────────────────────────────────┘
```

Both panels scroll independently. The InputPanel is sticky within the viewport on desktop — the user can scroll the results without losing sight of their inputs. A subtle scroll shadow appears at the bottom of the InputPanel when the content overflows.

The 380px InputPanel width is fixed. The ResultsPanel takes all remaining space. Minimum viable desktop width is 768px — below that, it switches to mobile layout.

### Mobile (<1024px)

Single-column, stacked layout:

```
TopBar
InputPanel (full width)
  TierCard 01
  [after user fills T1]
ResultsPlaceholder → WealthProjectionChart + BenchmarkCards
  [after T2 unlock]
DebtAnalysis + Housing + SavingsRate
  [after T3 unlock]
PersonalInflationCard + CategoryInflationChart
DataSourceFooter
```

On mobile, the ResultsPanel renders directly below the InputPanel, not side by side. As the user fills in Tier 1 inputs, results slide in below the input block. Users scroll down to see their results, then scroll back up to unlock the next tier.

The TierUnlockButton on mobile reads "Unlock deeper analysis" and is styled as a full-width secondary button, giving it enough tap target size.

Charts on mobile are capped at `height: 260px` and use horizontal scroll if the time axis is too dense.

---

## 6. Data Visualization Specifications

### Chart 1: Wealth Projection (Tier 1)

**Type:** Multi-series area chart with filled areas and solid lines

**Series:**
- Conservative: solid `accent-blue` line, `accent-blue` at 8% opacity fill below
- Moderate: solid `accent-amber` line, `accent-amber` at 8% opacity fill below
- Aggressive: solid `accent-rose` line, `accent-rose` at 8% opacity fill below
- National median reference: dashed `text-muted` horizontal or gently sloped line

**X-axis:** Years from today to age 70 (or 30 years, whichever is longer). Labeled at 5-year intervals using `mono-small`.

**Y-axis:** Currency in $K / $M, auto-scaled. Always starts at 0. Labels use `mono-small`.

**Interaction:**
- Hover/touch shows a vertical crosshair and a tooltip listing all three scenario values at that year, formatted with commas and K/M suffix
- A dot marker appears on each line at the hovered year
- The tooltip uses `chart-tooltip-bg` background with `text-primary` color (inverse of current mode)

**Animation:** On initial data entry (when the user types their first input that makes the chart renderable), all three lines draw left-to-right over 600ms using an ease-out curve. On subsequent updates (real-time typing), lines morph smoothly over 200ms — no redraw flicker.

**After Tier 2:** A translucent `accent-rose` horizontal band appears below the projection lines representing the "debt drag zone" — the portion of savings consumed by debt interest. The band label reads "Debt drag" in `accent-rose` at `caption` size.

**After Tier 3 (RealVsNominalToggle active):** The moderate projection line splits into two: solid (nominal) and dashed (real/inflation-adjusted) in the same `accent-amber` color. A small annotation at the chart end shows the gap: "Inflation costs you $X in purchasing power."

### Chart 2: Debt Analysis (Tier 2)

**Type:** Horizontal grouped bar chart

**Structure:** Two bars per group
- Group 1: Current debt total
- Group 2: Projected debt-free savings (same timeframe)

**Colors:**
- Debt bar: `accent-rose`
- Projected savings bar: `accent-emerald`

**X-axis:** Dollar amount, $0 to max, `mono-small` labels

**Y-axis:** Two labeled groups: "Current position" and "Debt-free projection (year X)"

**Interaction:** Hover tooltip shows exact values. No animation beyond initial bar grow (left to right, 400ms).

**Why not a donut or pie:** Debt vs savings is a comparison of two independent magnitudes, not parts of a whole. A grouped bar makes the gap feel physical and motivating.

### Chart 3: Savings Rate Comparison (Tier 2)

**Type:** Single horizontal bar with a marker

**Description:** One bar showing the user's current savings rate (monthly investment / income) as a filled segment. A vertical tick mark on the bar shows the national median savings rate from FRED. A secondary tick shows the recommended savings rate (15–20% rule of thumb).

**Colors:**
- User rate fill: `accent-blue`
- National median tick: `text-secondary`
- Recommended rate tick: `accent-emerald`

This is deliberately a single-number visualization — minimal chrome, maximum clarity.

### Chart 4: Category Inflation Breakdown (Tier 3)

**Type:** Horizontal bar chart, one bar per spending category

**Series per bar:**
- User's spend growth (calculated from inputs and historical FRED category CPI)
- National average CPI for that category (FRED series)

**Colors:**
- User bar: `accent-violet`
- National average bar: `text-muted`

**Categories (rows):** Food, Transport, Healthcare, Education, Energy/Utilities

**X-axis:** Year-over-year % change, labeled 0% to max+2%

**Why not a radar/spider chart:** Radar charts are notoriously hard to read and compare across categories. A horizontal bar chart is faster to scan and more accessible. The "spider web" aesthetic looks impressive but sacrifices comprehension. The bar chart wins for a financial planning tool where accuracy matters.

**Interaction:** Hover shows exact % values for both user and national. Categories where the user exceeds the national average are highlighted with a thin `accent-rose` left border on the row.

---

## 7. Interaction Patterns

### Real-Time Calculation

Calculations run on every keystroke with a 300ms debounce. This means:
- A user typing `50000` sees the chart update once they pause, not on each keystroke
- The chart does not flash or reset between keystrokes
- A subtle loading shimmer (not a spinner) appears on the chart area if calculation takes more than 100ms

The debounce prevents jarring updates while preserving the feeling that results are "live."

### Input Formatting

- **On focus:** Show raw number (e.g., `50000`) so the user can edit freely
- **On blur:** Format with commas and currency prefix (e.g., `$50,000`)
- **Invalid input:** If non-numeric characters are entered, the field shakes once (CSS keyframe animation) and clears. No error toast — the visual feedback is immediate.
- **Tab key:** Advances to the next field within the current tier. Does not advance to the next tier.

### Progressive Disclosure Transition

Tier 2 and Tier 3 unlock via the "Add more detail →" link at the bottom of the previous tier.

**The unlock animation:**
1. The locked TierCard's background transitions from `tier-locked` to `surface` over 200ms
2. The lock icon fades out
3. The card height expands from a collapsed state (showing only the header) to full height using a CSS height transition over 300ms with `ease-out`
4. Input fields fade in sequentially (stagger: 50ms per field) so the form does not appear all at once
5. On desktop, the ResultsPanel smoothly scrolls to show the new results section that is about to appear — giving the user a preview of what they are unlocking

**No page navigation.** The entire experience is a single page. No "next step" routing.

### Chart Animation Trigger Points

| Trigger | Animation |
|---|---|
| First valid T1 data | Chart draws left-to-right (600ms, ease-out) |
| User changes a value | Lines morph to new positions (200ms, ease-in-out) |
| Risk toggle changes | Chart lines instantly swap prominence, then settle (150ms) |
| T2 unlock | Debt drag band fades in below projection chart (400ms) |
| T3 unlock | Real/nominal split on the moderate line animates apart (600ms) |
| Real/nominal toggle | Lines split or merge (400ms) |

### Results Placeholder

Before any Tier 1 data is entered, the ResultsPanel shows a placeholder state:
- The chart area renders as a soft blurred placeholder (not a skeleton loader — a subtle illustration of three curved lines in muted colors)
- Text overlay: "Enter your age, income, and monthly investment to see your wealth trajectory"
- The BenchmarkCard slots show ghost placeholders

This communicates the shape of the final experience before data is entered.

---

## 8. Progressive Disclosure Transition Design

The three tiers follow a deliberate information architecture:

### Tier 1 completion signal

When all three Tier 1 inputs have valid values, the TierUnlockButton appears with a subtle entrance animation (fade up, 200ms). The button text and small supporting copy read:

> "Your projection is ready. Want a more accurate picture? →"

This is a pull mechanism — the user chooses to go deeper. There is no urgency or progress bar implying they are "only 33% done."

### Tier 2 completion signal

Same pattern. After all six Tier 2 fields are filled, the unlock prompt reads:

> "Debt and housing added. Unlock your personal inflation rate →"

### Tier 3 completion state

Tier 3 has no unlock prompt — it is the final tier. When all five fields are filled, the TierCard footer shows a simple completeness indicator: a green checkmark with the text "Your full financial picture is ready." No confetti, no celebration animation — the tone is professional.

### Locked tier visual treatment

Locked tiers render as cards with:
- `tier-locked` background
- `tier-locked-border` border
- Tier header visible (so users know what is coming)
- A single row of text at the card center: a lock icon (16px) + "Unlock after completing Step X"
- Input fields not rendered in the DOM (not hidden via CSS — genuinely absent, so tab order skips them)

This is deliberate: showing the tier header but not the fields creates curiosity without overwhelming.

---

## 9. Privacy Messaging

### PrivacyBadge (always visible, TopBar)

```
[lock icon]  All calculations run in your browser. No data sent.
```

The badge uses `privacy-badge-bg` and `privacy-badge-text`. It is a pill shape, 13px text, sitting in the top bar between the brand and the theme toggle. It is always visible on desktop. On mobile, it collapses to just the lock icon with a tooltip on tap.

### Privacy Modal (on badge click)

Title: "Your data stays with you"

Body (two short paragraphs):
> "Every number you enter is used only for calculations that run directly in your browser. Nothing is transmitted to a server, stored in a database, or shared with anyone.
>
> Economic benchmarks (national median income, inflation rates, market return assumptions) are fetched once from public FRED data when the page loads and cached locally. Your personal inputs never leave your device."

Close button only — no confirmation required.

### Input field placeholder text reinforcement

The first input (Age) has a placeholder: `e.g. 35`. All other inputs use minimal placeholders (`e.g. $65,000`). There are no "collect your email to save your results" prompts anywhere in the MVP.

### No persistent state

The app does not use localStorage or sessionStorage. Refreshing the page clears all inputs. This is intentional for MVP — it reinforces the privacy promise without needing to explain a data retention policy.

---

## 10. DataSourceFooter

A subtle footer at the bottom of the InputPanel (desktop) or below all results (mobile):

```
Economic data sourced from FRED (Federal Reserve Bank of St. Louis).
Market return assumptions: conservative 4%, moderate 7%, aggressive 10% (real, annualized).
This tool provides projections for educational purposes only. Not financial advice.
```

Font: `caption` size, `text-muted` color. No links in the MVP — just attribution text.

---

## 11. Accessibility Considerations

- All color pairs meet WCAG AA contrast ratio (4.5:1 for body text, 3:1 for large text and UI components)
- The RiskToggle and OwnershipToggle are keyboard navigable with arrow keys (roving tabindex)
- Charts include a visually hidden data table as an alternative representation (screen reader accessible)
- Focus rings use `border-focus` color at 2px width — visible in both modes
- All input labels are associated with their inputs via `for`/`id` attributes — no placeholder-only labels
- The PrivacyBadge modal traps focus when open and returns focus to the badge on close

---

## 12. Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| <480px (mobile-sm) | Full width, charts capped at 260px height, BenchmarkCards stack vertically |
| 480–768px (mobile-lg) | Same as mobile-sm, slightly more padding |
| 768–1024px (tablet) | InputPanel above results, side-by-side begins but panels shrink awkwardly — use mobile layout |
| ≥1024px (desktop) | Side-by-side, InputPanel fixed 380px |
| ≥1440px (desktop-wide) | InputPanel grows to 420px, ResultsPanel has more breathing room for charts |

---

## 13. Component States Reference

| Component | States |
|---|---|
| TierCard | locked, unlocked-empty, partial, complete |
| CurrencyInput | default, focused, filled, error |
| RiskToggle | conservative-selected, moderate-selected, aggressive-selected |
| OwnershipToggle | rent-selected, own-selected |
| TierUnlockButton | hidden (tier incomplete), visible, hover, active |
| BenchmarkCard | placeholder, loaded, above-median, below-median |
| WealthProjectionChart | placeholder, rendering, loaded, updating |
| PrivacyBadge | default, hover, modal-open |
| ThemeToggle | light-active, dark-active |
