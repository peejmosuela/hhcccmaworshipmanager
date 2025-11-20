# Design Guidelines: Church Worship Song & Setlist Management Application

## Design Approach: Material Design System

**Rationale:** This is a data-heavy, utility-focused application where efficiency and usability are paramount. Material Design provides robust patterns for forms, tables, lists, and data display - perfect for managing songs, setlists, and scheduling.

**Key Principles:**
- Clear information hierarchy for song data and setlists
- Intuitive navigation between Songs, Setlists, Musicians, and Statistics sections
- Minimal visual distraction to keep focus on content
- Responsive layout optimized for tablets and projection displays

---

## Typography System

**Font Stack:** Roboto (primary), fallback to system sans-serif
- **Headings:** Roboto Medium (500)
  - H1: 2.5rem (40px) - Page titles
  - H2: 2rem (32px) - Section headers
  - H3: 1.5rem (24px) - Card/panel titles
  - H4: 1.25rem (20px) - Song titles in lists
- **Body Text:** Roboto Regular (400), 1rem (16px)
- **Chord Display:** Roboto Mono (monospace), 0.875rem (14px), bold weight
- **Lyrics:** Roboto Regular, 1.125rem (18px) for readability
- **Metadata/Labels:** Roboto Regular, 0.875rem (14px)

---

## Layout & Spacing System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, and 12
- Component padding: p-6 (standard), p-8 (cards)
- Section spacing: mb-8, mb-12 between major sections
- Grid gaps: gap-4 for tight groups, gap-6 for cards
- Form field spacing: mb-4

**Layout Structure:**
- Side navigation (w-64) with main content area (flex-1)
- Max content width: max-w-7xl for main areas
- Song entry/edit forms: max-w-4xl for optimal reading
- Setlist view: max-w-6xl to accommodate multiple columns

**Responsive Breakpoints:**
- Mobile: Single column, collapsible navigation
- Tablet (md:): Two-column grids where appropriate
- Desktop (lg:): Full layout with persistent sidebar

---

## Component Library

### Navigation
- **Sidebar:** Persistent left navigation with sections for Songs, Setlists, Musicians, Statistics, Settings
- **Section tabs** within pages for sub-navigation (e.g., All Songs / Favorites / Recently Used)

### Song Entry & Display
- **Add Song Form:**
  - Large textarea for paste input (min-height: 24rem)
  - Auto-detect chord lines (letters like C, G, Am, D7 on separate lines)
  - Fields: Song Title, Artist, Key, Tags
  - Preview pane showing formatted chords/lyrics
  
- **Song Card (List View):**
  - Song title (H4), artist/key metadata
  - Quick actions: Add to Setlist, Edit, Delete
  - Usage count badge
  
- **Song Detail View:**
  - Two-column layout: Chords/Lyrics left, metadata/actions right
  - Chord lines in monospace, bold, with spacing matching lyrics below
  - Transpose controls: +/- buttons with current key display
  - Customization panel: Font size slider, highlight toggle for chords

### Setlist Management
- **Setlist Builder:**
  - Split view: Song library (left) + Current setlist (right)
  - Drag-drop or click-to-add functionality
  - Song order controls (drag handles, up/down buttons)
  - Header: Setlist name, date, song leader dropdown
  
- **Setlist Card:**
  - Title, date, song leader name
  - Song count, musicians assigned
  - Quick actions: View, Edit, Duplicate, Export
  
- **Setlist View (Display Mode):**
  - Full-screen option for projection
  - Song list with expand/collapse for each song
  - Large, readable text (configurable size)
  - Highlight options for chords vs lyrics

### Musician Management
- **Musician List:** Simple table with Name, Instrument, Contact
- **Assignment Interface:** Multi-select checkboxes or tag-style chips for assigning to setlists

### Statistics & Reports
- **Song Usage Dashboard:**
  - Table: Song name, last used date, total uses count
  - Filter by date range, song leader
  - Sort by frequency or recency

### Forms & Inputs
- Text inputs with floating labels
- Dropdowns for key selection (C, C#, D, etc.)
- Multi-select for musician assignment
- Radio buttons for customization options
- Primary action buttons (filled), secondary (outlined)

### Data Display
- **Tables:** Striped rows, hover states, sortable columns
- **Cards:** Elevated (shadow-sm), rounded corners (rounded-lg)
- **Chips/Tags:** Rounded-full for song tags, musician labels
- **Badges:** Rounded for counts (usage statistics)

---

## Critical Interactions

**Quick Add to Setlist:** 
- Floating action button on song cards
- Modal/dropdown showing recent setlists or "Create New"

**Transpose:**
- Inline controls on song view
- Real-time chord update without page reload

**Customization:**
- Sidebar panel with sliders and toggles
- Live preview of changes

**Copy-Paste Workflow:**
- Auto-focus on textarea when "Add Song" clicked
- Smart parsing to separate chord and lyric lines
- Clear visual feedback when chords detected

---

## No Animations
Minimal motion - only essential feedback (button clicks, form submissions). No scroll effects or decorative animations.

---

This design prioritizes clarity, efficiency, and ease of use for managing worship services while maintaining flexibility for customization and display needs.