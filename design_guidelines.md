# Design Guidelines: Church Worship Song & Setlist Management Application

## Design Approach: Spotify-Inspired Premium Music Interface

**Rationale:** While maintaining utility-focused efficiency for data management, the Spotify aesthetic elevates the music-centric nature of worship planning. Dark UI reduces eye strain during long planning sessions, green accents create visual hierarchy, and album-art style cards make song browsing engaging.

**Key Principles:**
- Premium dark interface with vibrant accent highlighting active states
- Music-first visual language with generous white space
- Clear information hierarchy through contrast and spacing
- Sophisticated, professional feel appropriate for worship leadership

---

## Typography System

**Font Stack:** Inter (primary), system-ui fallback
- **Display:** Inter SemiBold (600)
  - H1: 2.25rem (36px) - Page titles
  - H2: 1.875rem (30px) - Section headers
  - H3: 1.5rem (24px) - Card titles
- **Body:** Inter Regular (400), 0.9375rem (15px)
- **Song Titles:** Inter Medium (500), 1rem (16px)
- **Chords:** JetBrains Mono (monospace), 0.875rem (14px), Medium weight
- **Lyrics:** Inter Regular, 1.0625rem (17px), line-height 1.7
- **Labels/Metadata:** Inter Regular, 0.8125rem (13px), opacity-60

---

## Color Strategy

**Core Palette:**
- Background Primary: #121212
- Background Elevated: #181818 (cards, sidebar)
- Background Hover: #282828
- Text Primary: #FFFFFF
- Text Secondary: rgba(255,255,255,0.7)
- Text Tertiary: rgba(255,255,255,0.5)
- Accent Green: #1DB954 (CTAs, active states, highlights)
- Accent Green Hover: #1ED760
- Divider: rgba(255,255,255,0.1)

---

## Layout & Spacing System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12
- Card padding: p-6
- Section spacing: mb-8, mb-12
- Grid gaps: gap-6
- Form spacing: mb-6

**Layout Structure:**
- Left sidebar navigation (w-60, bg-black #000000)
- Main content area with max-w-7xl
- Song forms: max-w-5xl centered
- Two-column grids for song cards (md:grid-cols-2, lg:grid-cols-3)

---

## Component Library

### Navigation Sidebar
- Black background (#000000) with logo at top
- Navigation items: p-3, rounded-lg, hover:bg-[#282828]
- Active state: bg-[#282828] with left border-l-4 border-[#1DB954]
- Sections: Home, Songs, Setlists, Musicians, Statistics, Settings
- Bottom section: User profile card with name and logout

### Song Cards (Album-Style)
- Square placeholder area (aspect-square) with gradient background or icon
- Card background: bg-[#181818], rounded-lg, p-4
- Hover: transform scale-[1.02], shadow-lg
- Song title: Medium weight, text-white
- Artist/Key metadata: text-sm, opacity-70
- Quick action buttons (play icon, add to setlist, edit) appear on hover
- Usage count badge: absolute top-2 right-2, bg-[#1DB954], rounded-full

### Song Entry Form
- Large textarea: bg-[#282828], rounded-lg, p-6, min-h-96
- Input fields: bg-[#282828], border border-white/10, rounded-md, p-3
- Labels: text-sm, opacity-70, mb-2
- Preview pane: split-screen with formatted output
- Chord detection indicator: green dot when detected
- Submit button: bg-[#1DB954], px-8, py-3, rounded-full, font-medium

### Song Detail View
- Full-screen view option with dark background
- Left column: Chords/Lyrics with monospace chords in green
- Right sidebar: 
  - Transpose controls (+/- buttons, current key display)
  - Font size slider with live preview
  - Add to Setlist dropdown (green accent)
  - Edit/Delete actions
- Metadata panel: Artist, Key, Tags (as chips), Last Used, Usage Count

### Setlist Builder
- Split layout: Song library (left, 40%) + Active setlist (right, 60%)
- Library: Search bar at top, scrollable card grid
- Active setlist: 
  - Header: Editable title, date picker, song leader dropdown
  - Song list with drag handles (six-dots icon)
  - Each song shows thumbnail, title, key
  - Remove button (X) on hover
  - Footer: Total songs count, duration estimate, Save/Export buttons

### Setlist Cards
- Horizontal card layout: bg-[#181818], rounded-lg, p-6
- Left section: Date badge, setlist name (H3), song leader name
- Right section: Song count, musician chips, action buttons (View, Edit, Duplicate)
- Hover: subtle shadow elevation

### Display Mode (Projection)
- Full-screen black background
- Large song title at top with current key
- Chords in green, lyrics in white, generous line-height
- Navigation: Previous/Next buttons (bottom corners)
- Progress indicator: Song X of Y
- Exit button: top-right with blur background

### Musician Management
- Card grid layout with profile placeholder
- Each card: Name, instrument badge, contact info
- Assign to setlist: checkbox selection with green checkmarks
- Quick filters: By instrument, availability status

### Statistics Dashboard
- Cards with usage metrics: Total Songs, Active Setlists, Top Song
- Table: bg-[#181818], striped rows (alternate opacity), sortable headers
- Date range selector with green accent
- Visual bars showing usage frequency (green gradient)

### Forms & Inputs
- All inputs: bg-[#282828], rounded-md, focus:border-[#1DB954]
- Dropdowns: Custom styled with green selected state
- Multi-select: Chip-based with green chips
- Primary buttons: bg-[#1DB954], rounded-full, px-6, py-3
- Secondary buttons: border border-white/30, rounded-full
- Icon buttons: hover:bg-[#282828], rounded-full, p-2

---

## Images

**Song Card Placeholders:**
- 280x280px gradient backgrounds (dark gradient from #1DB954 to #1ed760 or similar vibrant combinations)
- Center icon: Music note or worship-related symbol in white/60% opacity
- Allow user-uploaded thumbnails for custom branding

**No Large Hero Image:**
This is a utility application - no marketing hero needed. Lead with the sidebar navigation and immediate access to song library.

---

## Critical Interactions

**Smooth Transitions:** All hover states use transition-all duration-200
**Quick Add:** Floating "+" button (bg-[#1DB954], rounded-full, shadow-lg) fixed bottom-right
**Transpose:** Real-time chord updates with subtle green flash animation
**Drag & Drop:** Visual feedback with elevated shadow and green outline on drop zones
**Search:** Instant filter with highlighted matches in green