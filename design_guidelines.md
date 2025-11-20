# Design Guidelines: Church Worship Song & Setlist Management Application

## Design Approach: Spotify-Inspired Card-Based Interface

**Rationale:** Dark premium aesthetic with card-based organization creates a sophisticated, music-centric workspace. The Spotify visual language—elevated cards on dark backgrounds with green accents—provides excellent information hierarchy while reducing eye strain during extended planning sessions.

**Key Principles:**
- Card-first architecture for all content organization
- Dashboard-centric navigation with overview metrics
- In-page content flow with minimal dialogs
- Generous white space between cards and sections
- Smooth scrolling experiences with subtle animations

---

## Typography System

**Font Stack:** Inter (Google Fonts via CDN)

**Hierarchy:**
- H1 (Page Titles): 2.25rem/36px, SemiBold (600)
- H2 (Section Headers): 1.875rem/30px, SemiBold (600)
- H3 (Card Titles): 1.5rem/24px, Medium (500)
- Body Text: 0.9375rem/15px, Regular (400)
- Song Titles: 1rem/16px, Medium (500)
- Metadata/Labels: 0.8125rem/13px, Regular (400)
- Chords: JetBrains Mono, 0.875rem/14px, Medium (500)
- Lyrics Display: 1.0625rem/17px, Regular (400), line-height 1.7

---

## Color Strategy

**Core Palette:**
- Background Base: #121212
- Card/Elevated Surface: #181818
- Hover State: #282828
- Sidebar: #000000
- Text Primary: #FFFFFF
- Text Secondary: rgba(255,255,255,0.7)
- Text Tertiary: rgba(255,255,255,0.5)
- Accent Primary: #1DB954 (green)
- Accent Hover: #1ED760
- Dividers: rgba(255,255,255,0.1)
- Success/Active: #1DB954
- Error: #E22134

---

## Layout & Spacing System

**Spacing Primitives:** Tailwind units 2, 4, 6, 8, 12
- Card padding: p-6
- Card gaps: gap-6
- Section margins: mb-8, mb-12
- Input spacing: mb-4
- Icon spacing: mr-2, ml-2

**Layout Structure:**
- Fixed left sidebar: w-60, bg-black
- Main content: ml-60, max-w-7xl, px-8
- Dashboard grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4, gap-6
- Song library grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Form containers: max-w-5xl, centered

---

## Component Library

### Persistent Sidebar Navigation
- Fixed left position, full height
- Black background (#000000) with logo/app name at top (p-6)
- Navigation groups with section labels (text-xs, opacity-50, uppercase)
- Nav items: rounded-lg, p-3, text-white/70, hover:bg-[#282828]
- Active state: bg-[#282828], text-white, border-l-4 border-[#1DB954]
- Sections: Dashboard, Songs, Setlists, Musicians, Display Mode, Settings
- Bottom: User profile card with avatar placeholder, name, role, logout button

### Dashboard Overview Cards
- Stat cards: bg-[#181818], rounded-lg, p-6
- Layout: Icon (green circle bg, white icon) + Label + Large number + Trend indicator
- Metrics: Total Songs, Active Setlists, Upcoming Services, Most Used Song
- Quick action cards: Recently used setlists (horizontal scroll), upcoming schedule
- Activity feed card: Recent changes with timestamps and user avatars

### Song Cards (Album-Style)
- Square thumbnail area: aspect-square, gradient background or music icon
- Card container: bg-[#181818], rounded-lg, p-4, hover:scale-[1.02]
- Song title: text-base, font-medium, text-white, mb-1
- Metadata row: Artist/Key in text-sm, opacity-70
- Usage badge: absolute top-2 right-2, bg-[#1DB954]/20, text-[#1DB954], rounded-full, px-2, py-1
- Action buttons: Hidden by default, appear on hover (Play, Add, Edit icons)

### Content Lists
- List container: bg-[#181818], rounded-lg, divide-y divide-white/10
- List items: p-4, hover:bg-[#282828], cursor-pointer
- Left section: Thumbnail (48x48) + Title (font-medium) + Subtitle (opacity-70)
- Right section: Metadata chips, action icons
- Drag handles: Six-dot icon, opacity-50, visible on hover
- Empty state: Centered icon, message, CTA button

### Song Detail/Edit View
- Full-width card layout (no dialogs)
- Header: Song title (H2), metadata row (key, artist, tags)
- Two-column layout: 
  - Left (60%): Lyrics/chords editor, bg-[#282828], rounded-lg, p-6, min-h-96
  - Right (40%): Controls card with transpose buttons, font size slider, quick actions
- Footer: Save button (bg-[#1DB954], rounded-full, px-8, py-3), Cancel, Delete

### Setlist Builder (In-Page)
- Page header: Setlist title (editable inline), date picker, leader dropdown
- Two-column layout with vertical divider:
  - Left (35%): Song library search + scrollable card grid
  - Right (65%): Active setlist with drag-sortable list
- Song items in setlist: Thumbnail + Title + Key badge + Remove icon
- Footer bar: Song count, total duration, Save/Export buttons (sticky)

### Forms & Inputs
- Text inputs: bg-[#282828], border border-white/10, rounded-md, p-3, focus:border-[#1DB954]
- Textareas: Same styling, min-h-32
- Dropdowns: Custom styled, chevron icon, green highlight on selected
- Multi-select: Chip display with green chips, X to remove
- Primary buttons: bg-[#1DB954], text-white, rounded-full, px-6, py-3, font-medium
- Secondary buttons: border border-white/30, text-white, rounded-full, px-6, py-3
- Icon buttons: hover:bg-[#282828], rounded-full, p-2

### Projection Display Mode
- Full-page black background overlay
- Large centered content area (max-w-4xl)
- Song title at top with key badge
- Chords in green (#1DB954), lyrics in white, generous spacing
- Bottom navigation: Prev/Next buttons (corners), progress indicator (center)
- Exit button: top-right, blur background, white text

---

## Images

**Approach:** No large hero images—this is a utility application focused on immediate functionality.

**Song Card Thumbnails:**
- 280x280px gradient backgrounds (dark to vibrant green gradients)
- Centered music note icon in white at 60% opacity
- User-uploadable custom thumbnails supported
- Fallback: Random gradient from preset collection

---

## Critical Interactions

**Smooth Scrolling:** All page transitions and card scrolling use smooth-scroll behavior
**Transitions:** All interactive elements use transition-all duration-200
**Card Hovers:** transform scale-[1.02] with subtle shadow elevation
**Floating Add Button:** Fixed bottom-right, bg-[#1DB954], rounded-full, shadow-xl, z-50
**Real-time Updates:** Chord transposition, search filtering with green highlight on matches
**Drag Feedback:** Elevated shadow, green outline on valid drop zones
**Focus States:** Green ring (ring-2 ring-[#1DB954]) on all interactive elements
**No Popups:** All editing and creation happens in-page with slide-in or full-page views