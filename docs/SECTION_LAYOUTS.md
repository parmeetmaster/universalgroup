# Section Layout Standards

Standard layout types used across the Chinese Drama browse API and mobile app. Backend returns `layout` as a lowercase string in each section object. Frontend renders accordingly.

**Rule: All layout keys are always lowercase with hyphens.**

## Layout Types

| Layout | Key | Description | Columns | Scroll | Use Case |
|--------|-----|-------------|---------|--------|----------|
| 3-Row Grid No Title | `3-row-grid-notitle` | 3 columns, no section title rendered | 3 | Vertical | Default grid layout for all types |
| 2-Row Grid No Title | `2-row-grid-notitle` | 2 columns, no section title rendered | 2 | Vertical | Explore + All genre, page 2+ pagination |
| 3-Row Grid | `3-row-grid` | 3 columns, with title header | 3 | Vertical | Sections with visible title |
| 2-Row Grid | `2-row-grid` | 2 columns, with title header | 2 | Vertical | Most Recommended section |
| Horizontal List 2 | `horizontal-list-2` | 2-row horizontal scroll list | 2 rows | Horizontal | New Releases, genre highlights — 10 items |
| Horizontal | `horizontal` | Single row, horizontal scroll | N/A | Horizontal | Featured rail, "See All" preview |
| Banner | `banner` | Full-width single card | 1 | Swipe/Carousel | Hero carousel, promotions |
| List | `list` | Vertical list, 1 item per row | 1 | Vertical | Episode list, search results |

## API Response Structure

```json
{
  "type": "explore",
  "sections": [
    {
      "layout": "3-row-grid-notitle",
      "title": "Popular",
      "dramas": [ ... ]
    },
    {
      "layout": "horizontal-list-2",
      "title": "New Releases",
      "dramas": [ ... ]
    },
    {
      "layout": "2-row-grid",
      "title": "Most Recommended",
      "dramas": [ ... ]
    },
    {
      "layout": "3-row-grid-notitle",
      "title": "Popular",
      "dramas": [ ... ]
    }
  ],
  "page": 1,
  "totalPages": 5,
  "total": 100
}
```

## Section Object

| Field | Type | Description |
|-------|------|-------------|
| `layout` | `string` | One of the layout keys above (always lowercase) |
| `title` | `string` | Section heading text |
| `dramas` | `array` | Array of drama objects |

## Layout Rendering Rules

### `3-row-grid-notitle`
- 3 equal-width columns, **no section title rendered**
- `title` field still present in response (for internal reference) but not displayed
- **Item count MUST be a multiple of 3**
- Used for: all types (new, ranking, anime) on every page, explore page 1 first section, genre-filtered results

### `2-row-grid-notitle`
- 2 equal-width columns, **no section title rendered**
- Same rendering rules as `3-row-grid-notitle` but with 2 columns (wider cards)
- `title` field still present in response (for internal reference) but not displayed
- **Item count MUST be a multiple of 2**
- Used for: **only** explore + genre "All" + page 2+ (paginated continuation)

### `3-row-grid`
- 3 equal-width columns
- **Item count MUST be a multiple of 3** — backend trims extra items (`count % 3 === 0` always)
- Section title is rendered as a heading above the grid
- Card: poster image (aspect 2:3), title below, genre subtitle, view count badge
- Badge overlay: "Hot" (red) or "New" (green) top-right corner
- Infinite scroll pagination (load next page on scroll end)

### `2-row-grid`
- 2 equal-width columns
- **Item count MUST be a multiple of 2** — backend trims extra items (`count % 2 === 0` always)
- Larger cards than 3-row-grid
- Same card content as 3-row-grid but with more space for text

### `horizontal-list-2`
- 2 rows stacked, horizontal scroll
- 10 items total (5 per row)
- Card: small poster left, title + genre right (compact horizontal card)
- Section title visible above
- No pagination — fixed 10 items from API

### `horizontal`
- Single horizontal scrollable row
- Card width: ~130px fixed
- Shows poster + title only (compact)
- "See All" arrow at end (optional)
- No pagination — limited to 10 items from API

### `banner`
- Full-width card or swipeable carousel
- Shows large_poster (landscape aspect)
- Overlay: title, genre, rating
- Auto-rotate every 5s (frontend decision)

### `list`
- Full-width rows, one item per row
- Horizontal layout: small poster left, title + metadata right
- Used for episode lists, search results

## Badge Rules

| Badge | Condition | Color |
|-------|-----------|-------|
| `hot` | `all_time_watch_count >= 500,000` | Red |
| `new` | Created within last 14 days | Green |
| `null` | Neither condition met | No badge |

## Merge Rule — `-notitle` as Grid Extension

`-notitle` layouts are not always independent sections. They can **merge into** a preceding grid section of the same column family.

### How it works

When frontend receives a `-notitle` section, it checks the **last rendered section**:

- **Same column family grid exists above?** → **MERGE** — append items to that section, do NOT render a new title or new section
- **No matching grid above?** → **INDEPENDENT** — render as a standalone section without title

### Column Families

| Family | Titled variant | No-title variant |
|--------|---------------|-----------------|
| 3-column | `3-row-grid` | `3-row-grid-notitle` |
| 2-column | `2-row-grid` | `2-row-grid-notitle` |

### Merge Matrix

| Last Rendered Section | Incoming Section | Result |
|---|---|---|
| `3-row-grid` | `3-row-grid-notitle` | **MERGE** — append to existing 3-col grid |
| `3-row-grid-notitle` | `3-row-grid-notitle` | **MERGE** — append to existing 3-col grid |
| `2-row-grid` | `2-row-grid-notitle` | **MERGE** — append to existing 2-col grid |
| `2-row-grid-notitle` | `2-row-grid-notitle` | **MERGE** — append to existing 2-col grid |
| `horizontal-list-2` | `3-row-grid-notitle` | **INDEPENDENT** — no matching grid above |
| `banner` | `2-row-grid-notitle` | **INDEPENDENT** — no matching grid above |
| Any non-matching type | Any `-notitle` | **INDEPENDENT** |

### Example — Explore + All

**Page 1 response:**
```
Section 0: 3-row-grid-notitle  → Independent (first section, nothing above)
Section 1: horizontal-list-2   → Independent (different type)
Section 2: 2-row-grid          → Independent (different type, has title "Most Recommended")
```

**Page 2 response:**
```
Section 0: 2-row-grid-notitle  → MERGE into Section 2 ("Most Recommended")
                                  because last grid was 2-row-grid (same family)
```

Result: "Most Recommended" section grows with more items, no new heading appears.

### Example — New type, page 1 + page 2

**Page 1 response:**
```
Section 0: 3-row-grid-notitle  → Independent (first section)
```

**Page 2 response:**
```
Section 0: 3-row-grid-notitle  → MERGE into page 1's Section 0
                                  because last grid was 3-row-grid-notitle (same family)
```

Result: Single continuous 3-column grid, items keep appending on scroll.

### Backend responsibility
- Backend decides the layout per section
- Backend ensures item count is a multiple of the column count (trimmed)
- Backend does NOT merge — it sends flat sections per page

### Frontend responsibility
- Frontend tracks the last rendered grid section
- On receiving `-notitle`, check if merge applies (same column family)
- If merge: append items to existing section's grid
- If independent: render new section without title
- On pagination (next page load), apply same merge logic against the last section on screen

## Notes

- **Layout keys are always lowercase** with hyphens (e.g. `3-row-grid`, not `3-ROW-GRID` or `3_row_grid`)
- Frontend must handle unknown layout types gracefully — fallback to `3-row-grid`
- First section on page 1 is the "hero" section — backend decides its layout
- Grid sections are paginated, horizontal/banner sections are not (max 10 items)
