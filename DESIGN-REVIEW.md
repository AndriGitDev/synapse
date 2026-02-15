# SYNAPSE Design Review

**Reviewer:** Data 🖖  
**Date:** 2026-02-15  
**Site:** synapse.andri.is  
**Verdict:** Strong foundation, impressive for AI-built. Several fixable issues holding it back from feeling truly polished.

---

## 1. First Impressions — ⭐⭐⭐⭐ (4/5)

**The good:** The hero is clear and compelling. "Watch AI agents think in real-time" communicates the value prop in under 3 seconds. The gradient text treatment and the "How it works" pipeline diagram are effective.

**The bad:** "Watch Bubbi Live" as the primary CTA is confusing for first-time visitors. Who is Bubbi? The landing page mentions Bubbi three times without ever explaining what it is. This is an insider-knowledge problem — it assumes context the visitor doesn't have.

**Fix:** Add a one-liner under the CTA or in the Bubbi section: "Bubbi is our demo AI agent" → already partially there in the bottom section but not where the CTA is.

## 2. Visual Hierarchy — ⭐⭐⭐⭐ (4/5)

**The good:** Clean information architecture. Nav → Hero → How It Works → Features → CTA → Footer. Eyes flow naturally downward. The architecture diagram (AI Agent → Pusher → Synapse → Viewers) is excellent — instantly communicates the system without words.

**The bad:** The features grid (Live Streaming, Interactive Graph, Multi-Agent) feels like filler after the strong architecture diagram. These cards repeat what was already communicated visually above. Consider replacing with a screenshot/GIF of the actual graph visualization — that's the product's wow factor and it's completely absent from the landing page.

## 3. Mobile Experience — ⭐⭐⭐ (3/5)

**Critical issues found:**

- **Architecture diagram on mobile:** The `flex-col` layout stacks the 4 steps vertically but the `ArrowRight` arrows between them are `hidden sm:block`, so on mobile the steps just float disconnected. Needs vertical arrows or numbered steps.
- **App page graph:** ReactFlow on mobile is functional but the nodes (280-360px wide) are wider than most phone screens (375px). Touch-dragging works but initial viewport is zoomed out too far — the "Press play" prompt is tiny.
- **Event detail panel:** Good — goes full-screen overlay on mobile (`fixed inset-0 sm:inset-auto`). This is correct.
- **Playback controls:** Speed buttons (1x/2x/4x/8x) are cramped on narrow screens. The progress bar click target at 1.5px height (6px with `h-1.5`) is too thin for touch — should be at least 44px tap target.

## 4. Interaction Design — ⭐⭐⭐⭐ (4/5)

**The good:**
- Keyboard shortcuts (Space, Arrow keys, R) are intuitive and well-chosen
- Node click → detail panel is discoverable
- Playback metaphor (play/pause/step/speed) is immediately understandable
- Session selector dropdown with AnimatePresence is smooth

**The bad:**
- No onboarding hint about clicking nodes for details. New users will watch the playback without knowing nodes are interactive.
- The "Press play or spacebar to start" hint is good but disappears the moment you interact — could flash once more after 5s of inactivity.
- In live/watch mode, there's no way to replay or scrub through past events. You can only watch the latest. This is a significant UX gap for the core use case.

## 5. Typography & Spacing — ⭐⭐⭐⭐ (4/5)

**The good:** Inter + JetBrains Mono is a solid pairing. The type scale is consistent: 10px labels, 11px metadata, sm for body, base-xl for headings. Tracking is well-tuned (`tracking-tight` on headings, `tracking-wider` on labels).

**The bad:**
- The `text-[10px]` and `text-[11px]` arbitrary values are used heavily. These are below WCAG's recommended minimum for body text (12px). Fine for badges/labels, but some content text uses them.
- Node content text at `text-sm` (14px) with `max-w-[360px]` creates ~60 characters per line, which is good.

## 6. Color & Contrast — ⭐⭐⭐ (3/5)

**Accessibility concerns:**
- `text-slate-500` on `bg-slate-950` = contrast ratio ~3.4:1. **Fails WCAG AA** (4.5:1 required for normal text). This is used extensively for secondary text throughout the app.
- `text-slate-600` on `bg-slate-950` = ~2.3:1. **Fails badly.** Used in the footer, metadata, and help text.
- `text-indigo-300` on `bg-indigo-500/20` (badges) = borderline, depends on the computed background.
- The event color system is well-designed for sighted users — purple/blue/green/cyan/orange/yellow/red gives good differentiation. But the `/20` opacity backgrounds mean the actual rendered colors on the dark background may not meet contrast requirements.

**Fix needed:** Bump secondary text from `slate-500`/`slate-600` to `slate-400` minimum.

## 7. Performance — ⭐⭐⭐⭐ (4/5)

**The good:**
- Zustand over Redux is the right call — minimal bundle overhead
- `SynapseNode` is `memo`'d — critical for ReactFlow performance
- Node visibility uses `hidden` prop rather than conditional rendering — ReactFlow handles this efficiently
- No obvious N+1 re-render patterns in the store

**Concerns:**
- `reactflow` is ~150KB gzipped. For a visualization tool this is justified, but the landing page imports nothing from it — good code splitting via Next.js app router.
- `framer-motion` on every node animation could cause jank with 50+ nodes. The `initial/animate` on `SynapseNodeComponent` runs on every mount. Consider disabling entrance animations during fast playback (4x/8x speed).
- The `layoutEvents` function recalculates all node positions on every `currentEventIndex` change. For large sessions (100+ events), this is O(n) per tick. Not catastrophic but could be memoized.

## 8. Empty States & Loading — ⭐⭐⭐⭐⭐ (5/5)

**Excellent.** Every mode has a thoughtful empty state:
- Upload: Drop zone with format hints
- Live: Connection form with status indicator
- Watch: Animated "Waiting for Bubbi" with bounce dots
- Error states: Clear messages with retry actions
- File parse errors: Specific error messages with "Try again" button

This is one of the strongest aspects of the app. Well done.

## 9. Micro-interactions — ⭐⭐⭐⭐ (4/5)

**The good:**
- Node entrance: `opacity: 0, scale: 0.8, x: -20` → natural "appearing" feel
- Progress bar glow effect is satisfying
- Mode tab transitions are smooth
- Dropdown spring animation `[0.23, 1, 0.32, 1]` is a nice custom ease

**The bad:**
- The `animate-pulse` on the live indicator dots is the default Tailwind pulse (opacity 0→1) which is slightly jarring. A gentler `animate-pulse-soft` is defined in globals.css but not used here.
- The `animate-ping` on the Watch Bubbi waiting screen (2s duration) is aggressive for a "calm waiting" state.

## 10. Competitive Positioning — ⭐⭐⭐⭐ (4/5)

**vs Langfuse/LangSmith:** These are observability platforms (traces, evals, cost tracking). Synapse is NOT competing here — it's a visualization/spectator tool. The positioning is actually quite unique. Nobody else does "watch an AI think in real-time as a graph." Smart niche.

**vs Vercel AI Dashboard:** Vercel focuses on usage metrics and model comparison. Synapse focuses on the thought process itself. Complementary, not competitive.

**Unique advantages:**
- The "Watch Live" concept is genuinely novel
- Multi-agent visualization with color-coded lanes is impressive
- The playback metaphor (VCR controls for AI reasoning) is intuitive and unique
- Upload mode means it can work with any agent, not just specific frameworks

**Gaps vs competitors:**
- No cost/token tracking per event
- No comparison view (side-by-side sessions)
- No search/filter within sessions
- No sharing (permalink to a specific session state)

---

## Priority Fixes (Shipped in PR)

### P0 — Accessibility
1. **Fix contrast ratios:** `slate-500` → `slate-400` for readable secondary text
2. **Increase progress bar touch target** to 44px

### P1 — Mobile
3. **Add vertical connectors** to architecture diagram on mobile
4. **Improve node sizing** hints for mobile viewports

### P2 — UX Polish
5. **Add "click nodes for details" hint** during playback
6. **Use `animate-pulse-soft`** for live indicators instead of harsh `animate-pulse`

---

## Overall Score: 3.9/5

This is genuinely impressive work — especially as an AI-built competition entry. The core concept is strong, the implementation is clean, and the empty states are better than most production apps I've reviewed. The main gaps are accessibility (contrast) and mobile polish. Fix those and this is a 4.3+.

*— Data 🖖*
