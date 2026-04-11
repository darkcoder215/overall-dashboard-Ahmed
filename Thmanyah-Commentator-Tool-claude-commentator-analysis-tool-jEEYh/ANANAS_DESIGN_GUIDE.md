# Ananas (أناناس) Design Guide

> Derived from the **Ananas Branding** folder assets and UI mockups.
> This guide governs the Ananas-themed variant of the Commentator Analysis Tool.
> It uses the same **Thmanyah font families** from the `Usable/` directory.

---

## 1. Brand Essence

**Ananas (أناناس)** is a performance evaluation and talent management platform. The brand identity is built on:

| Principle (Arabic) | Principle (English) | Meaning |
|---|---|---|
| تقييم واضح ومباشر | Clear and direct evaluation | Every rating is transparent, color-coded, and immediately understandable. |
| معايير موحدة | Unified standards | Consistent criteria applied across all talent — presenters, reporters, analysts. |
| تطوير مستمر | Continuous development | Track progress over time with periodic evaluations and timelines. |

**Application to our tool:** When the Ananas theme is active, the tool adopts a cleaner, more structured evaluation interface — emphasizing rating tiers (فخر، أخضر، صفر، خطر، حمر), structured criteria cards, and a professional white-dominant aesthetic.

---

## 2. Logo

### 2.1 Ananas Icon
- A bold, geometric **angular bird/leaf** mark pointing upward-right
- Sharp, modern, confident geometry
- Used in headers, top-right corner of pages
- Displayed in **black** on light backgrounds, **white** on dark backgrounds

### 2.2 Logo Usage
| Context | Logo Color | Background |
|---|---|---|
| Light mode (primary) | Black `#000000` | White `#FFFFFF` |
| Dark header/banner | White `#FFFFFF` | Black `#000000` |
| Report headers | White `#FFFFFF` | Black `#000000` |

### 2.3 Safe Space
- Minimum clear space = **1.5x** the height of the logo mark
- Logo appears in top-right corner of all pages (RTL layout)

---

## 3. Color Palette

### 3.1 Primary Colors

| Name | Hex | Usage |
|---|---|---|
| **Bold Black** | `#000000` | Primary text, headers, logo, report banners |
| **White** | `#FFFFFF` | Page background, cards, clean surfaces |
| **Prime Orange** | `#FF4D00` | Primary brand accent, CTAs, active states |

### 3.2 Secondary Colors

| Name | Hex | Usage |
|---|---|---|
| **Blue** | `#0066FF` | Links, interactive elements, info states |
| **Maroon** | `#800020` | Deep accent, critical level, secondary emphasis |
| **Lavender** | `#C8A2E8` | Decorative purple accent, light emphasis |
| **Gold** | `#FFD700` | Yellow/caution rating tier, highlights |
| **Violet** | `#7B2D8E` | Secondary purple accent |
| **Rose** | `#FF69B4` | Soft pink accent, decorative |
| **Sea** | `#20B2AA` | Teal accent, cool tones |
| **Taupe** | `#D2B48C` | Warm neutral accent |

### 3.3 Semantic / Rating Colors (5-Tier System)

The Ananas rating system uses **5 distinct color-coded tiers** — a key differentiator from the Thmanyah theme:

| Rating (Arabic) | Rating (English) | Solid Color | Light Tint | Emoji | Score Range |
|---|---|---|---|---|---|
| **فخر** (Pride) | Outstanding | `#0A6847` (Dark Green) | `#E8F5E9` | 🏅 | 90–100 |
| **أخضر** (Green) | Good | `#00C17A` (Bright Green) | `#E0F7EC` | 🌿 | 75–89 |
| **صفر** (Yellow) | Average | `#FFD700` (Gold/Yellow) | `#FFF9E0` | 🔶 | 60–74 |
| **خطر** (Danger) | Below Average | `#F24935` (Red/Coral) | `#FDECEB` | ⚠️ | 40–59 |
| **حمر** (Red) | Critical | `#8B0000` (Dark Red) | `#FBE4E4` | 🚫 | 0–39 |

### 3.4 Neutral Colors — Light Mode

| Name | Hex | Usage |
|---|---|---|
| **Cool Gray** | `#F5F5F5` | Page background, section dividers |
| **Taupe N20** | `#F0EBE3` | Subtle card backgrounds |
| **Taupe N10** | `#F7F3ED` | Very light surfaces |
| **Sea N20** | `#E0F2F1` | Cool accent backgrounds |
| **Coral N20** | `#FFF3E0` | Warm accent backgrounds |

### 3.5 Neutral Colors — Dark Mode

| Name | Hex | Usage |
|---|---|---|
| **Blocky Likey** | `#1A1A2E` | Dark mode page background |
| **Dark Night** | `#16213E` | Dark mode card background |
| **Night** | `#2C2C44` | Dark mode elevated surfaces |
| **Burgundy Dark** | `#4A0028` | Dark mode deep accent |

### 3.6 Transparent Colors

| Name | Value | Usage |
|---|---|---|
| **Black T0** | `rgba(0,0,0,0)` | Transparent overlay base |
| **Black T12** | `rgba(0,0,0,0.12)` | Subtle dark overlays |
| **White T0** | `rgba(255,255,255,0)` | Transparent light base |
| **White T12** | `rgba(255,255,255,0.12)` | Subtle light overlays on dark |

---

## 4. Typography

### 4.1 Font Families

Ananas uses the **same Thmanyah font families** from the `Usable/` directory:

| Font Family | Purpose in Ananas | Character |
|---|---|---|
| **Thmanyah Sans** | Primary UI font — all interface text, labels, buttons, data | Clean, modern, highly legible |
| **Thmanyah Serif Display** | Report headers, evaluation titles, large scores | Elegant impact for key headings |
| **Thmanyah Serif Text** | Comments, notes, feedback paragraphs | Comfortable reading at body sizes |

### 4.2 Font Usage Hierarchy (Ananas-specific)

| Element | Font Family | Weight | Size |
|---|---|---|---|
| **Report Banner Title** | Serif Display | Black (900) | 28–36px |
| **Section Heading** | Serif Display | Bold (700) | 22–26px |
| **Evaluation Question** | Sans | Bold (700) | 16–18px |
| **Rating Pill Text** | Sans | Bold (700) | 13–14px |
| **Criteria Labels** | Sans | Medium (500) | 14–15px |
| **Notes / Observations** | Serif Text | Regular (400) | 14px |
| **Small Labels** | Sans | Regular (400) | 12–13px |
| **Score Display** | Serif Display | Black (900) | 36–48px |

### 4.3 Numeral System
Same as Thmanyah: **Western Arabic (English) numerals** — `0 1 2 3 4 5 6 7 8 9`

---

## 5. CSS Design Tokens (Ananas Theme)

```css
[data-theme="ananas"] {
  /* ── Primary ── */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-green: #00C17A;
  --color-green-light: #E0F7EC;
  --color-green-pale: #E8F5E9;
  --color-accent: #FF4D00;

  /* ── Rating Tier Colors ── */
  --rating-pride: #0A6847;
  --rating-pride-light: #E8F5E9;
  --rating-green: #00C17A;
  --rating-green-light: #E0F7EC;
  --rating-yellow: #FFD700;
  --rating-yellow-light: #FFF9E0;
  --rating-danger: #F24935;
  --rating-danger-light: #FDECEB;
  --rating-red: #8B0000;
  --rating-red-light: #FBE4E4;

  /* ── Brand Accents ── */
  --color-blue: #0066FF;
  --color-red: #F24935;
  --color-orange: #FF4D00;

  /* ── Extended Palette ── */
  --color-maroon: #800020;
  --color-lavender: #C8A2E8;
  --color-gold: #FFD700;
  --color-violet: #7B2D8E;
  --color-rose: #FF69B4;
  --color-sea: #20B2AA;
  --color-taupe: #D2B48C;
  --color-amber: #FFD700;
  --color-peach: #FF9172;

  /* ── Neutrals ── */
  --color-dark-slate: #1A1A2E;
  --color-charcoal: #2C2C44;
  --color-muted: #666680;
  --color-warm-gray: #EEEEEE;
  --color-cream: #F5F5F5;
  --color-off-white: #FAFAFA;

  /* ── Semantic ── */
  --color-success: #0A6847;
  --color-warning: #FFD700;
  --color-error: #8B0000;
  --color-info: #0066FF;

  /* ── Score Gradation (5-tier) ── */
  --score-pride: #0A6847;
  --score-excellent: #00C17A;
  --score-average: #FFD700;
  --score-below-average: #F24935;
  --score-poor: #8B0000;

  /* ── Typography ── */
  --font-display: 'Thmanyah Serif Display', 'Georgia', serif;
  --font-body: 'Thmanyah Serif Text', 'Georgia', serif;
  --font-ui: 'Thmanyah Sans', 'Segoe UI', 'Helvetica Neue', sans-serif;

  /* ── Spacing (8px grid) ── */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px;

  /* ── Border Radius ── */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.1);
}
```

---

## 6. Rating System UI Components

### 6.1 Rating Pill Selector

The Ananas evaluation uses a **5-tier pill selector** for each criterion:

```
 ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
 │ فخر 🏅│  │أخضر🌿│  │ صفر 🔶│  │ حمر 🚫│  │ خطر ⚠️│
 └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
  Selected:  Filled color + white text
  Inactive:  Gray background (#E0E0E0) + muted text
```

### 6.2 Rating Row (Evaluation State)

Each evaluation question displays as a full-width row:
- **Unrated:** White/light gray background, neutral text
- **فخر:** Dark green background `#0A6847`, white text
- **أخضر:** Green background `#00C17A`, white text
- **صفر:** Yellow background `#FFD700`, dark text
- **خطر:** Red/coral background `#F24935`, white text
- **حمر:** Dark red background `#8B0000`, white text

### 6.3 Color-Coded Progress Bars

Full-width rounded bars showing the rating tier as solid color fills:

```
فخر   ████████████████████████████████████  (100% dark green)
أخضر  ████████████████████████████████      (80% bright green)
صفر   ████████████████████████              (60% yellow)
خطر   ████████████████                      (40% red)
حمر   ████████                              (20% dark red)
```

---

## 7. Layout Patterns

### 7.1 Page Structure (from mockups)

```
┌─────────────────────────────────────────────────────┐
│  مرحبا  ✿ أيمن المطلق   🖊 تعديل    ☆ حفظ         │  Top nav bar (light)
│                                          ◆ Logo     │  Logo top-right
├─────────────────────────────────────────────────────┤
│                                                     │
│          📋 تقييمك العام                             │  Section heading
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📅 التقييم الدوري    الربع الثالث 2025       │    │  Period header
│  │                                             │    │
│  │ ┌─ حمر ──┐  كيف تقيم درب الموظف بشكل عام ؟ │    │  Rating + Question
│  │ └────────┘                                  │    │
│  │                                             │    │
│  │ ●●●●●  كيف حقق التوقعات؟                   │    │  Dot ratings
│  │ ●●●●●  كيف مع بيئكامب ؟                    │    │  (colored circles)
│  │ ★★★★☆  كيف جودة المخرجات؟                  │    │
│  │ ●●●●○  كيف الانضباط في الوقت؟               │    │
│  │ ...                                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│          💬 التعليقات العامة                          │  Comments section
│  ┌─────────────────────────────────────────────┐    │
│  │ الملاحظات العامة                              │    │  Gray bg textarea
│  │ نص الملاحظات...                               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  جميع الحقوق محفوظة لشركة لعاية للنشر والتوزيع ©   │  Footer
└─────────────────────────────────────────────────────┘
```

### 7.2 Report Banner (A4 / PDF)

```
┌─────────────────────────────────────────────┐
│              ██████████████████              │  Black background
│           التقييم الدوري 📋                   │  White text
│              محمد عقده                        │  Person name (serif)
│                                             │
│  ◆ Logo                       الربع... 2025 │
├─────────────────────────────────────────────┤
│                                             │
│  📊 المعايير العامة                          │  Criteria section
│                                             │
│  ●●●●●   كيف حسن المبادرة؟      أخضر       │  Rating dots + label
│  ●●●●○   كيف حسن المبادرة؟      خطر        │
│  ...                                        │
│                                             │
│  📊 الحضور و الانضباط                        │  Another section
│  ...                                        │
│                                             │
│  💬 ملاحظات التقييم                          │  Evaluator notes
└─────────────────────────────────────────────┘
```

### 7.3 Evaluation Modal (Previous Review)

A modal overlay displays previous evaluations:
- Dark-bordered card on white background
- Tabs: "تقييم عام" (General) + "التقييم السابق" (Previous)
- Collapsible evaluation periods
- Arrow indicators for expand/collapse

---

## 8. Component Design Patterns

### 8.1 Evaluation Question Card
```css
.ananas-eval-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  border: 1px solid #EEEEEE;
  margin-bottom: var(--space-4);
}
```

### 8.2 Rating Dot System
Colored circles (●) representing rating, 5 dots per criterion:
- Filled dots = rating level achieved
- Empty dots = remaining potential
- Colors match the 5-tier system

### 8.3 Section Headers
```css
.ananas-section-header {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  text-align: center;
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
```

### 8.4 Comments / Notes Section
```css
.ananas-comments {
  background: #F5F5F5;
  border-radius: var(--radius-md);
  padding: var(--space-5);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}
```

### 8.5 Buttons
| Type | Background | Text | Border |
|---|---|---|---|
| Primary | `#000000` | `#FFFFFF` | none |
| Secondary | `#FFFFFF` | `#000000` | 1px solid `#EEEEEE` |
| Accent | `#FF4D00` | `#FFFFFF` | none |
| Success | `#0A6847` | `#FFFFFF` | none |
| Danger | `#8B0000` | `#FFFFFF` | none |

All buttons: `border-radius: 9999px` (pill shape), Sans Bold, 14px.

---

## 9. Visual Style Differences from Thmanyah Theme

| Aspect | Thmanyah Theme | Ananas Theme |
|---|---|---|
| **Primary accent** | Green `#00C17A` | Orange `#FF4D00` |
| **Rating system** | 4-tier (Excellent/Good/Average/Poor) | 5-tier (فخر/أخضر/صفر/خطر/حمر) |
| **Score colors** | Green → Amber → Peach → Red | Dark Green → Green → Yellow → Red → Dark Red |
| **Page background** | Warm Off-White `#F7F4EE` | Cool White `#FAFAFA` |
| **Sidebar** | Black `#000000` | Black `#000000` (same) |
| **Card style** | Warm shadows, cream tints | Clean shadows, neutral backgrounds |
| **Accent elements** | Green highlights | Orange highlights |
| **Evaluation UI** | Progress bars + percentages | Rating pills + colored dots |
| **Nav active color** | Green `#00C17A` | Orange `#FF4D00` |
| **Overall feeling** | Warm, editorial, nature-inspired | Professional, structured, corporate |

---

## 10. Semantic Color Mapping (for the Commentator Tool)

| State | Color Name | Hex | Light Tint |
|---|---|---|---|
| **Outstanding (فخر)** | Dark Green | `#0A6847` | `#E8F5E9` |
| **Good (أخضر)** | Bright Green | `#00C17A` | `#E0F7EC` |
| **Average (صفر)** | Gold Yellow | `#FFD700` | `#FFF9E0` |
| **Below Average (خطر)** | Coral Red | `#F24935` | `#FDECEB` |
| **Critical (حمر)** | Dark Red | `#8B0000` | `#FBE4E4` |
| **Info / Neutral** | Blue | `#0066FF` | `#E3F2FD` |
| **Interactive / Link** | Orange | `#FF4D00` | `#FFF3E0` |

---

## 11. Background Philosophy

| Surface | Color |
|---|---|
| Page background | `#FAFAFA` (Cool White) |
| Sidebar / Navigation | `#000000` (Black) |
| Cards | `#FFFFFF` with subtle shadow |
| Report banner | `#000000` (Black) with white text |
| Evaluation rows (rated) | Light tint of the rating color |
| Comments/notes section | `#F5F5F5` (Light Gray) |
| Modal overlays | Semi-transparent black `rgba(0,0,0,0.5)` |
| Footer | Light gray border-top, centered text |

---

## 12. Responsive Breakpoints

Same as Thmanyah — see main DESIGN_GUIDE.md.

---

## 13. Asset Reference

| Asset | Path | Notes |
|---|---|---|
| Serif Display fonts | `Usable/Thmanyahserifdisplay12-*.otf` | Shared with Thmanyah theme |
| Serif Text fonts | `Usable/Thmanyahseriftext12-*.otf` | Shared with Thmanyah theme |
| Sans fonts | `Usable/Thmanyahsans12-*.otf` | Shared with Thmanyah theme |
| Ananas branding reference | `Ananas Branding/` | Design mockups and color references |

---

## 14. Do's and Don'ts

### Do:
- Use the 5-tier rating system (فخر، أخضر، صفر، خطر، حمر) consistently
- Use Orange `#FF4D00` as the primary accent for interactive elements
- Keep backgrounds clean and cool-toned (`#FAFAFA`)
- Use colored rating pills with emoji indicators
- Display evaluation questions in a structured, card-based layout
- Use dot-based rating visualizations alongside progress bars
- Center section headings with icon decorators (📋, 💬, 📊)

### Don't:
- Don't mix the 4-tier Thmanyah scoring with the 5-tier Ananas scoring
- Don't use warm off-white backgrounds (that's the Thmanyah theme)
- Don't use Thmanyah green as the primary accent (use Orange instead)
- Don't skip the rating tier labels — always show "فخر", "أخضر", etc.
- Don't remove the emoji indicators from rating pills
- Don't use sharp corners on interactive elements

---

*This guide should be consulted when the Ananas theme is active. The theme can be toggled via the sidebar switcher. Both themes share the same Thmanyah font families but differ in color palette, rating system, and accent elements.*
