# Phase 3 Research: Enhanced Category Filtering

## Current Implementation
- **Frontend**: `Dashboard.jsx` uses a `useState` for `activeFilter` (Name). It maps over `categories` from the API and renders buttons.
- **Backend**: `routes.js` handles `categoryId` in `/api/memes`. It use SQL binds for filtering.

## Findings
- **State Logic**: The logic is sound (debounced fetch on filter/search change).
- **UI Design**: The current buttons are simple `.btn` classes. They lack a distinct "active" state that pops in the glassmorphism theme.
- **Performance**: Backend performance is fine for current scale.

## Proposed Enhancements
1.  **Glass Filter Bar**: Wrap categories in a `.glass-card` container with internal horizontal scrolling for mobile.
2.  **Active State Glow**: Use the `--glass-glow` token for the active category to make it "pulsate" or stand out.
3.  **Count Integration**: Small counts (e.g., "5") next to category names (already fetched in `stats/categories`).
4.  **Transitions**: Add a subtle `transform: scale(1.05)` and glow transition for the active filter.

## Discovery Level
- **Level 0**: This is a UI refactor using established patterns. No new libraries are required.
